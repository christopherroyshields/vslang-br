import { ExtensionContext, languages, workspace, Uri, window, WorkspaceFolder, Disposable, DocumentSelector, RelativePattern, WorkspaceFoldersChangeEvent, ConfigurationChangeEvent, TextDocument, commands, Diagnostic, Range, Position, DiagnosticSeverity, DiagnosticCollection, StatusBarAlignment } from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import BrSignatureHelpProvider from './providers/BrSignatureHelpProvider';
import BrHoverProvider from './providers/BrHoverProvider';
import LibLinkListProvider from './providers/LibLinkListProvider';
import LibPathProvider from './providers/LibPathProvider';
import FuncCompletionProvider from './providers/FuncCompletionProvider';
import StatementCompletionProvider from './providers/StatementCompletionProvider';
import BrSourceSymbolProvider from './providers/BrSymbolProvider';
import { performance } from 'perf_hooks';
import Layout from './class/Layout';
import { Project } from './class/Project';
import LayoutSemanticTokenProvider, { LayoutLegend } from './providers/LayoutSemanticTokenProvider';
import KeywordCompletionProvider from './providers/KeywordCompletionProvider';
import BrParser from './parser';
import BrDiagnostics from './class/BrDiagnostics';
import { debounce } from './util/common';
import OccurenceHighlightProvider from './providers/OccurenceHighlightProvider';
import BrRenameProvider from './providers/BrRenameProvider';
import BrWorkspaceSymbolProvider from './providers/BrWorkspaceSymbolProvider';
import { log } from 'console';
import LocalVariableCompletionProvider from './providers/LocalCompletionProvider';
import LocalFunctionCompletionProvider from './providers/LocalFunctionCompletionProvider';
import InternalFunctionCompletionProvider from './providers/InternalFunctionCompletionProvider';
import BrReferenceProvder from './providers/BrReferenceProvider';
import BrDefinitionProvider from './providers/BrDefinitionProvider';
import SourceDocument from './class/SourceDocument';
import LibraryFunctionIndex from './class/LibraryFunctionIndex';
import { initializeSearchOutputChannel, executeSearch } from './brSearch';
import { BrLineNumberProvider } from './providers/BrLineNumberProvider';

export async function activate(context: ExtensionContext) {
	const subscriptions = context.subscriptions
	
	const parser = new BrParser()
	subscriptions.push(parser)
	await parser.activate(context)

	activateLexi(context)

	activateNextPrev(context)

	const layoutSemanticTokenProvider = new LayoutSemanticTokenProvider()

	subscriptions.push(languages.registerDocumentSemanticTokensProvider({
		language: "lay",
		scheme: "file"
	}, layoutSemanticTokenProvider, LayoutLegend))
	
	const sel: DocumentSelector = {
		language: "br"
	}

	const statementCompletionProvider = new StatementCompletionProvider()
	subscriptions.push(languages.registerCompletionItemProvider(sel, statementCompletionProvider))

	const internalFunctionCompletionProvider = new InternalFunctionCompletionProvider()
	subscriptions.push(languages.registerCompletionItemProvider(sel, internalFunctionCompletionProvider))

	// activateClient(context)

	const brSourceSymbolProvider = new BrSourceSymbolProvider(parser)
	subscriptions.push(languages.registerDocumentSymbolProvider(sel, brSourceSymbolProvider))

	const occurrenceProvider = new OccurenceHighlightProvider(parser)
	subscriptions.push(languages.registerDocumentHighlightProvider(sel,occurrenceProvider))

	const renameProvider = new BrRenameProvider(parser)
	subscriptions.push(languages.registerRenameProvider(sel, renameProvider))

	const keywordCompletionProvider = new KeywordCompletionProvider()
	subscriptions.push(languages.registerCompletionItemProvider(sel, keywordCompletionProvider))

	const localVariableCompletionProvider = new LocalVariableCompletionProvider(parser)
	subscriptions.push(languages.registerCompletionItemProvider(sel, localVariableCompletionProvider))

	const localFunctionCompletionProvider = new LocalFunctionCompletionProvider(parser)
	subscriptions.push(languages.registerCompletionItemProvider(sel, localFunctionCompletionProvider))

	const configuredProjects: Map<WorkspaceFolder, Project> = new Map()
	// Start workspace folder activation in background - don't await
	activateWorkspaceFolders(context, configuredProjects, parser)

	const diagnostics = new BrDiagnostics(parser, context)

	const hoverProvider = new BrHoverProvider(configuredProjects, parser)
	subscriptions.push(languages.registerHoverProvider(sel, hoverProvider))

	const signatureHelpProvider = new BrSignatureHelpProvider(configuredProjects, parser)
	subscriptions.push(languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ","))

	const referenceProvider = new BrReferenceProvder(configuredProjects, parser)
	subscriptions.push(languages.registerReferenceProvider(sel, referenceProvider))

	const definitionProvider = new BrDefinitionProvider(configuredProjects, parser)
	subscriptions.push(languages.registerDefinitionProvider(sel, definitionProvider))

	const lineNumberProvider = new BrLineNumberProvider(parser)
	subscriptions.push(commands.registerTextEditorCommand('vslang-br.autoInsertLineNumber', (editor, edit) => {
		lineNumberProvider.handleEnterKey(editor, edit);
	}))

	const funcCompletionProvider = new FuncCompletionProvider(configuredProjects, parser)
	languages.registerCompletionItemProvider(sel, funcCompletionProvider)

	const libLinkListProvider = new LibLinkListProvider(configuredProjects)
	languages.registerCompletionItemProvider(sel, libLinkListProvider, ":", ",", " ")

	const libPathProvider = new LibPathProvider(configuredProjects, parser)
	languages.registerCompletionItemProvider(sel, libPathProvider, "\"", "'")

	const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, configuredProjects)
	languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider)

	// Register walkthrough command
	subscriptions.push(commands.registerCommand('vslang-br.openWalkthrough', () => {
		commands.executeCommand('workbench.action.openWalkthrough', 'crs-dev.vslang-br#brLanguageExtension', false).then((result) => {
			console.log(result)
		}, (error) => {
			console.error(error)
		})
	}))

	// Initialize BR search feature
	initializeSearchOutputChannel(context)

	// Register BR search command
	subscriptions.push(commands.registerCommand('br.searchFiles', async () => {
		await executeSearch()
	}))

}

export function deactivate() {
	// deactivateClient();
}

/**
 * Sets up monitoring of project configuration
 */
async function activateWorkspaceFolders(context: ExtensionContext, configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser): Promise<Map<WorkspaceFolder, Project>> {
	const disposablesMap = new Map<WorkspaceFolder,Disposable[]>()
	if (workspace.workspaceFolders){
		for (const workspaceFolder of workspace.workspaceFolders) {
			const disposables: Disposable[] = []
			const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
			configuredProjects.set(workspaceFolder, project)
			disposablesMap.set(workspaceFolder, disposables)

			workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
				if (e.affectsConfiguration("br", workspaceFolder)){
					disposablesMap.get(workspaceFolder)?.forEach(d => d.dispose())	
					const disposables: Disposable[] = []
					const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
					configuredProjects.set(workspaceFolder, project)
					disposablesMap.set(workspaceFolder, disposables)
				}
			})
		}
	}

	workspace.onDidChangeWorkspaceFolders(async ({ added, removed }: WorkspaceFoldersChangeEvent) => {
		if (added) {
			for (const workspaceFolder of added) {
				const disposables: Disposable[] = []
				const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
				configuredProjects.set(workspaceFolder, project)
				disposablesMap.set(workspaceFolder, disposables)
			}
		}
		if (removed){
			for (const workspaceFolder of removed) {
				disposablesMap.get(workspaceFolder)?.forEach(d => d.dispose())
			}
		}
	})

	return configuredProjects
}

async function readSourceFile(uri: Uri, workspaceFolder: WorkspaceFolder, parser: BrParser): Promise<SourceDocument | undefined> {
	try {
		const libText = await workspace.fs.readFile(uri)
		if (libText){
			// Quick pre-scan for library function patterns (fast regex check)
			const fileContent = libText.toString()
			const hasLibraryPattern = /\bDEF\s+LIB/i.test(fileContent) || /\bLIBRARY\s+["\w]/i.test(fileContent)

			// Create SourceDocument - skip expensive library scanning if no pattern detected
			const treeDoc = new SourceDocument(parser, uri, libText, workspaceFolder, hasLibraryPattern)
			return treeDoc
		}
	} catch (error: any) {
		console.error(`Error reading source file: ${uri.fsPath}, ${error.message}`)
		window.showErrorMessage(`Error reading source: ${uri.fsPath}, ${error.message}`)
	}
}

async function startWatchingFiles(workspaceFolder: WorkspaceFolder, disposables: Disposable[], parser: BrParser, context: ExtensionContext): Promise<Project> {
	const project: Project = {
		sourceFiles: new Map<string, SourceDocument>(),
		layouts: new Map<string, Layout>(),
		libraryIndex: new LibraryFunctionIndex()
	}

	const searchPath = workspace.getConfiguration('br', workspaceFolder).get("searchPath", "");

	await watchLayoutFiles(workspaceFolder, searchPath, project, disposables)
	await watchSourceFiles(workspaceFolder, searchPath, project, disposables, parser, context)

	return project
}

async function readLayout(uri: Uri): Promise<Layout | undefined> {
	try {
		const layoutBuffer = await workspace.fs.readFile(uri)
		if (layoutBuffer){
			const layout = Layout.parse(layoutBuffer.toString())
			return layout
		}
	} catch {
		console.error(`Layout file could not be read: ${uri.fsPath}`)
	}
}

async function watchLayoutFiles(workspaceFolder: WorkspaceFolder, searchPath: string, project: Project, disposables: Disposable[]) {
	const layoutPath = workspace.getConfiguration('br', workspaceFolder).get("layoutPath", "filelay");
	const layoutGlob = workspace.getConfiguration('br', workspaceFolder).get("layoutGlobPattern", "*.*");
	const layoutFolderPattern = new RelativePattern(Uri.joinPath(workspaceFolder.uri, searchPath, layoutPath), layoutGlob)
	const layoutFiles = await workspace.findFiles(layoutFolderPattern)
	for (const uri of layoutFiles) {
		const layout = await readLayout(uri)
		if (layout){
			project.layouts.set(uri.toString(), layout)
		}
	}

	const layoutWatcher = workspace.createFileSystemWatcher(layoutFolderPattern)
	layoutWatcher.onDidChange(async (uri: Uri) => {
		const layout = await readLayout(uri)
		if (layout){
			for (const [uri] of project.layouts) {
				if (uri === uri.toString()){
					project.layouts.set(uri.toString(), layout)
				}
			}
		}
	}, undefined, disposables)

	layoutWatcher.onDidDelete(async (uri: Uri) => {
		project.layouts.delete(uri.toString())
	}, undefined, disposables)

	layoutWatcher.onDidCreate(async (uri: Uri) => {
		const sourceLib = await readLayout(uri)
		if (sourceLib){
			project.layouts.set(uri.toString(), sourceLib)
		}
	}, undefined, disposables)
}

async function watchSourceFiles(workspaceFolder: WorkspaceFolder, searchPath: string, project: Project, disposables: Disposable[], parser: BrParser, context: ExtensionContext) {
	const sourceGlob = workspace.getConfiguration('br', workspaceFolder).get("sourceFileGlobPattern", "**/*.{brs,wbs}");
	const sourceFileGlobPattern = new RelativePattern(Uri.joinPath(workspaceFolder.uri, searchPath), sourceGlob)

	// const startTime = performance.now()
	const sourceFiles = await workspace.findFiles(sourceFileGlobPattern)
	// const endTime = performance.now()
	// console.log(`sourc load: ${endTime - startTime} ms`);
	
	// Create status bar when we start reading files
	const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
	context.subscriptions.push(statusBarItem)
	let fileCount = 0
	let lastUpdateTime = 0
	let lastFileName = ""
	
	const updateStatusBar = () => {
		const now = Date.now()
		if (now - lastUpdateTime >= 200) {
			statusBarItem.text = `$(loading~spin) Scanning for libraries (${fileCount}) ${lastFileName}`
			lastUpdateTime = now
		}
	}
	
	const incrementCounter = (fileName: string) => {
		fileCount++
		lastFileName = fileName
		updateStatusBar()
	}
	
	// Show status bar only if we have files to load
	if (sourceFiles.length > 0) {
		statusBarItem.text = `$(loading~spin) Indexing libraries (${fileCount})`
		statusBarItem.show()
	}
	
	const scanStartTime = performance.now()
	let filesWithLibraries = 0

	// Process files in batches to avoid blocking UI
	const BATCH_SIZE = 10
	for (let i = 0; i < sourceFiles.length; i += BATCH_SIZE) {
		const batch = sourceFiles.slice(i, i + BATCH_SIZE)

		// Process batch in parallel
		await Promise.all(batch.map(async (sourceUri) => {
			try {
				// Read file buffer
				const libText = await workspace.fs.readFile(sourceUri)
				if (!libText) {
					return
				}

				// Quick pre-scan for library function patterns (fast regex check)
				const fileContent = libText.toString()
				const hasLibraryPattern = /\bDEF\s+LIB/i.test(fileContent) || /\bLIBRARY\s+["\w]/i.test(fileContent)

				// Create SourceDocument - skip expensive library scanning if no pattern detected
				const sourceLib = new SourceDocument(parser, sourceUri, libText, workspaceFolder, hasLibraryPattern)
				project.sourceFiles.set(sourceUri.toString(), sourceLib)

				// Only index library functions if pattern was detected
				if (hasLibraryPattern) {
					filesWithLibraries++
					const libFunctions = sourceLib.getLibraryFunctionsMetadata()
					if (libFunctions.length > 0) {
						const fileName = sourceUri.fsPath.split('\\').pop() || sourceUri.fsPath.split('/').pop() || sourceUri.fsPath
						const functionNames = libFunctions.map(f => f.name).join(', ')
						// console.log(`  ${fileName}: [${functionNames}]`)
					}
					for (const libFunc of libFunctions) {
						project.libraryIndex.addFunction(libFunc);
					}
				}
				incrementCounter(sourceUri.fsPath.split('\\').pop() || sourceUri.fsPath.split('/').pop() || sourceUri.fsPath)
			} catch (error: any) {
				console.error(`Error reading source file: ${sourceUri.fsPath}, ${error.message}`)
			}
		}))

		// Small delay between batches to keep UI responsive
		if (i + BATCH_SIZE < sourceFiles.length) {
			await new Promise(resolve => setTimeout(resolve, 10))
		}
	}

	const scanEndTime = performance.now()
	const totalScanTime = scanEndTime - scanStartTime
	const averagePerFile = sourceFiles.length > 0 ? (totalScanTime / sourceFiles.length).toFixed(2) : 0
	const totalLibraryFunctions = project.libraryIndex.getAllFunctions().length
	console.log(`Scanned ${sourceFiles.length} files in ${totalScanTime.toFixed(2)}ms (avg: ${averagePerFile}ms/file) - Found ${totalLibraryFunctions} library functions in ${filesWithLibraries} files`)

	// Hide status bar when done loading
	statusBarItem.hide()

	const codeWatcher = workspace.createFileSystemWatcher(sourceFileGlobPattern)
	codeWatcher.onDidChange(async (sourceUri: Uri) => {
		const brSource = await readSourceFile(sourceUri, workspaceFolder, parser)
		if (brSource){
			// Remove old functions from index
			project.libraryIndex.removeFunctionsFromUri(sourceUri);
			// Update source file
			for (const [uri] of project.sourceFiles) {
				if (uri === sourceUri.toString()){
					project.sourceFiles.set(sourceUri.toString(), brSource)
				}
			}
			// Add new functions to index
			for (const libFunc of brSource.getLibraryFunctionsMetadata()) {
				project.libraryIndex.addFunction(libFunc);
			}
			if (parser.trees.has(sourceUri.toString())){
				parser.getUriTree(sourceUri,true)
			}
		}
	}, undefined, disposables)

	codeWatcher.onDidDelete(async (sourceUri: Uri) => {
		project.sourceFiles.delete(sourceUri.toString())
		project.libraryIndex.removeFunctionsFromUri(sourceUri);
		if (parser.trees.has(sourceUri.toString())){
			parser.trees.delete(sourceUri.toString())
		}
	}, undefined, disposables)

	codeWatcher.onDidCreate(async (sourceUri: Uri) => {
		const sourceLib = await readSourceFile(sourceUri, workspaceFolder, parser)
		if (sourceLib){
			project.sourceFiles.set(sourceUri.toString(), sourceLib)
			// Add library functions to the index
			for (const libFunc of sourceLib.getLibraryFunctionsMetadata()) {
				project.libraryIndex.addFunction(libFunc);
			}
		}
	}, undefined, disposables)

	// console.log(`files watched`);

}

