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
import TreeSitterSourceDocument from './class/TreeSitterSourceDocument';

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
	await activateWorkspaceFolders(context, configuredProjects, parser)

	const diagnostics = new BrDiagnostics(parser, context)

	const hoverProvider = new BrHoverProvider(configuredProjects, parser)
	subscriptions.push(languages.registerHoverProvider(sel, hoverProvider))

	const signatureHelpProvider = new BrSignatureHelpProvider(configuredProjects, parser)
	subscriptions.push(languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ","))

	const referenceProvider = new BrReferenceProvder(parser)
	subscriptions.push(languages.registerReferenceProvider(sel, referenceProvider))


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

async function readSourceFileToTree(uri: Uri, workspaceFolder: WorkspaceFolder, parser: BrParser): Promise<TreeSitterSourceDocument | undefined> {
	try {
		const libText = await workspace.fs.readFile(uri)
		if (libText){
			// let startTime = performance.now()
			// const newDoc = new ProjectSourceDocument(libText.toString(), uri, workspaceFolder)
			// let endTime = performance.now()
			// console.log(`Regex Parse: ${endTime - startTime} milliseconds`)

			const startTime = performance.now()
			// const tree = parser.parser.parse(libText.toString())
			const treeDoc = new TreeSitterSourceDocument(parser, uri, libText, workspaceFolder)
			const endTime = performance.now()
			console.log(`Tree Parse: ${endTime - startTime} milliseconds`)

			return treeDoc
		}
	} catch (error: any) {
		window.showErrorMessage(`Error reading source: ${uri.fsPath}, ${error.message}`)
	}
}

async function startWatchingFiles(workspaceFolder: WorkspaceFolder, disposables: Disposable[], parser: BrParser, context: ExtensionContext): Promise<Project> {
	const project: Project = {
		sourceFiles: new Map<string, TreeSitterSourceDocument>(),
		layouts: new Map<string, Layout>()
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
		window.showWarningMessage(`Library source not found ${uri.fsPath}`)
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

	const startTime = performance.now()
	const sourceFiles = await workspace.findFiles(sourceFileGlobPattern)
	const endTime = performance.now()
	console.log(`sourc load: ${endTime - startTime} ms`);
	
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
		statusBarItem.text = `$(loading~spin) Scanning for libraries (${fileCount})`
		statusBarItem.show()
	}
	
	for (const sourceUri of sourceFiles) {
		const sourceLib = await readSourceFileToTree(sourceUri, workspaceFolder, parser)
		if (sourceLib){
			project.sourceFiles.set(sourceUri.toString(), sourceLib)
			incrementCounter(sourceUri.fsPath.split('\\').pop() || sourceUri.fsPath.split('/').pop() || sourceUri.fsPath)
		}
	}
	
	// Hide status bar when done loading
	statusBarItem.hide()

	const codeWatcher = workspace.createFileSystemWatcher(sourceFileGlobPattern)
	codeWatcher.onDidChange(async (sourceUri: Uri) => {
		const brSource = await readSourceFileToTree(sourceUri, workspaceFolder, parser)
		if (brSource){
			for (const [uri] of project.sourceFiles) {
				if (uri === sourceUri.toString()){
					project.sourceFiles.set(sourceUri.toString(), brSource)
				}
			}
			if (parser.trees.has(sourceUri.toString())){
				parser.getUriTree(sourceUri,true)
			}
		}
	}, undefined, disposables)

	codeWatcher.onDidDelete(async (sourceUri: Uri) => {
		project.sourceFiles.delete(sourceUri.toString())
		if (parser.trees.has(sourceUri.toString())){
			parser.trees.delete(sourceUri.toString())
		}
	}, undefined, disposables)

	codeWatcher.onDidCreate(async (sourceUri: Uri) => {
		const sourceLib = await readSourceFileToTree(sourceUri, workspaceFolder, parser)
		if (sourceLib){
			project.sourceFiles.set(sourceUri.toString(), sourceLib)
		}
	}, undefined, disposables)

	console.log(`files watched`);

}

