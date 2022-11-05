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
import Layout from './class/Layout';
import { Project } from './providers/Project';

const SOURCE_GLOB = '**/*.{brs,wbs}'
const ConfiguredProjects = new Map<WorkspaceFolder, Project>()

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

	activateClient(context)

	activateWorkspaceFolders()

	workspace.onDidChangeTextDocument((e)=>{
		var startTime = performance.now()

		// const testdoc = new BrSourceDocument(e.document.getText())
		const src = new BrSourceDocument(e.document.getText())
				
		var endTime = performance.now()
		
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

async function startWatchingSource(workspaceFolder: WorkspaceFolder, disposables: Disposable[]): Promise<Project> {
	const project: Project = {
		sourceFiles: new Map<string, ProjectSourceDocument>(),
		layouts: new Map<string, Layout>()
	}

	const searchPath = workspace.getConfiguration('br', workspaceFolder).get("searchPath", "");

	const layoutPath = workspace.getConfiguration('br', workspaceFolder).get("layoutPath", "filelay");
	const layoutGlob = workspace.getConfiguration('br', workspaceFolder).get("br.layoutGlobPattern", "*.*");
	const layoutFolderPattern = new RelativePattern(Uri.joinPath(workspaceFolder.uri, searchPath, layoutPath), layoutGlob)
	const layoutFiles = await workspace.findFiles(layoutFolderPattern)
	for (const uri of layoutFiles) {
		const layout = await readLayout(uri)
		if (layout){
			project.layouts.set(uri.toString(), layout)
		}
	}

	const folderPattern = new RelativePattern(workspaceFolder, SOURCE_GLOB)
	const sourceFiles = await workspace.findFiles(folderPattern)
	for (const sourceUri of sourceFiles) {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			project.sourceFiles.set(sourceUri.toString(), sourceLib)
		}
	}

	const codeWatcher = workspace.createFileSystemWatcher(folderPattern)
	codeWatcher.onDidChange(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			for (const [uri] of project.sourceFiles) {
				if (uri === sourceUri.toString()){
					project.sourceFiles.set(sourceUri.toString(), sourceLib)
				}
			}
		}
	}, undefined, disposables)

	codeWatcher.onDidDelete(async (sourceUri: Uri) => {
		project.sourceFiles.delete(sourceUri.toString())
	}, undefined, disposables)

	codeWatcher.onDidCreate(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, workspaceFolder)
		if (sourceLib){
			project.sourceFiles.set(sourceUri.toString(), sourceLib)
		}
	}, undefined, disposables)

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
