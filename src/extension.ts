import { ExtensionContext, languages, workspace, Uri, window, WorkspaceFolder, Disposable, DocumentSelector, RelativePattern, WorkspaceFoldersChangeEvent } from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import BrSignatureHelpProvider from './providers/BrSignatureHelpProvider';
import BrHoverProvider from './providers/BrHoverProvider';
import LibLinkListProvider from './providers/LibLinkListProvider';
import LibPathProvider from './providers/LibPathProvider';
import FuncCompletionProvider from './providers/FuncCompletionProvider';
import StatementCompletionProvider from './providers/StatementCompletionProvider';
import BrSourceSymbolProvider from './providers/BrSymbolProvider';
import ProjectSourceDocument from './class/ProjectSourceDocument';
import BrSourceDocument from './class/BrSourceDocument';
import { performance } from 'perf_hooks';

const SOURCE_GLOB = '**/*.{brs,wbs}'
const ConfiguredProjects = new Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>()

const signatureHelpProvider = new BrSignatureHelpProvider(ConfiguredProjects)
const hoverProvider = new BrHoverProvider(ConfiguredProjects)
const libLinkListProvider = new LibLinkListProvider(ConfiguredProjects)
const libPathProvider = new LibPathProvider(ConfiguredProjects)
const funcCompletionProvider = new FuncCompletionProvider(ConfiguredProjects)
const statementCompletionProvider = new StatementCompletionProvider(ConfiguredProjects)
const brSourceSymbolProvider = new BrSourceSymbolProvider()

export function activate(context: ExtensionContext) {
	
	activateLexi(context)

	activateNextPrev(context)

	activateClient(context)

	activateWorkspaceFolders()

	const sel: DocumentSelector = {
		language: "br"
	}

	languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ",")

	languages.registerHoverProvider(sel, hoverProvider)

	languages.registerCompletionItemProvider(sel, libLinkListProvider, ":", ",", " ")
	
	languages.registerCompletionItemProvider(sel, libPathProvider, "\"", "'")

	languages.registerCompletionItemProvider(sel, funcCompletionProvider)

	languages.registerCompletionItemProvider(sel, statementCompletionProvider)

	languages.registerDocumentSymbolProvider(sel, brSourceSymbolProvider)

	workspace.onDidChangeTextDocument((e)=>{
		var startTime = performance.now()

		// const testdoc = new BrSourceDocument(e.document.getText())
		const wordCount = BrSourceDocument.parse(e.document)
				
		var endTime = performance.now()
		
		console.log(wordCount)
		console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
		// console.log(testdoc.variables);
	})
}

export function deactivate() {
	deactivateClient();
}

/**
 * Sets up monitoring of project configuration
 */
function activateWorkspaceFolders() {
	const disposablesMap = new Map<WorkspaceFolder,Disposable[]>()
	if (workspace.workspaceFolders){
		workspace.workspaceFolders.forEach(async (workspaceFolder: WorkspaceFolder) => {
			const disposables: Disposable[] = []
			const project = await startWatchingSource(workspaceFolder, disposables)
			ConfiguredProjects.set(workspaceFolder, project)
			disposablesMap.set(workspaceFolder, disposables)
		})
	}

	workspace.onDidChangeWorkspaceFolders(async ({ added, removed }: WorkspaceFoldersChangeEvent) => {
		if (added) {
			for (const workspaceFolder of added) {
				const disposables: Disposable[] = []
				const project = await startWatchingSource(workspaceFolder,  disposables)
				ConfiguredProjects.set(workspaceFolder, project)
				disposablesMap.set(workspaceFolder, disposables)
			};
		}
		if (removed){
			for (const workspaceFolder of removed) {
				disposablesMap.get(workspaceFolder)?.forEach(d => d.dispose())
			}
		}
	})
}

async function updateLibraryFunctions(uri: Uri, workspaceFolder: WorkspaceFolder): Promise<ProjectSourceDocument | undefined> {
	try {
		const libText = await workspace.fs.readFile(uri)
		if (libText){
			const newDoc = new ProjectSourceDocument(libText.toString(), uri, workspaceFolder)
			return newDoc
		}
	} catch {
		window.showWarningMessage(`Library source not found ${uri.fsPath}`)
	}
}

async function startWatchingSource(workspaceFolder: WorkspaceFolder, disposables: Disposable[]): Promise<Map<string, ProjectSourceDocument>> {
	const folderPattern = new RelativePattern(workspaceFolder, SOURCE_GLOB)
	const project = new Map<string, ProjectSourceDocument>()

	const sourceFiles = await workspace.findFiles(folderPattern)
	for (const sourceUri of sourceFiles) {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			project.set(sourceUri.toString(), sourceLib)
		}
	}

	const codeWatcher = workspace.createFileSystemWatcher(folderPattern)
	codeWatcher.onDidChange(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			for (const [uri] of project) {
				if (uri === sourceUri.toString()){
					project.set(sourceUri.toString(), sourceLib)
				}
			}
		}
	}, undefined, disposables)

	codeWatcher.onDidDelete(async (sourceUri: Uri) => {
		project.delete(sourceUri.toString())
	}, undefined, disposables)

	codeWatcher.onDidCreate(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			project.set(sourceUri.toString(), sourceLib)
		}
	}, undefined, disposables)

	return project
}