import { ExtensionContext, languages, workspace, Uri, window, WorkspaceFolder, Disposable, DocumentSelector, RelativePattern, WorkspaceFoldersChangeEvent } from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import * as path from 'path'
import ConfiguredProject from './class/ConfiguredProject';
import ProjectConfig from './interface/ProjectConfig';
import BrSourceDocument from './class/BrSourceDocument';
import BrSignatureHelpProvider from './providers/BrSignatureHelpProvider';
import BrHoverProvider from './providers/BrHoverProvider';
import LibLinkListProvider from './providers/LibLinkListProvider';
import LibPathProvider from './providers/LibPathProvider';
import FuncCompletionProvider from './providers/FuncCompletionProvider';
import StatementCompletionProvider from './providers/StatementCompletionProvider';
import BrSourceSymbolProvider from './providers/BrSymbolProvider';

const SOURCE_GLOB = '**/*.{brs,wbs}'
const ConfiguredProjects = new Map<WorkspaceFolder, ConfiguredProject>()

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

	activateWorkspaceFolders(context)

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
}

export function deactivate() {
	deactivateClient();
}

/**
 * Sets up monitoring of project configuration
 * @param context extension context
 */
function activateWorkspaceFolders(context: ExtensionContext) {
	const folderDisposables: Map<WorkspaceFolder, Disposable[]> = new Map()
	workspace.onDidChangeWorkspaceFolders(async ({ added, removed }: WorkspaceFoldersChangeEvent) => {
		if (added) {
			for (let workspaceFolder of added) {
				folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder))
			};
		}
		if (removed){
			for (let workspaceFolder of removed) {
				folderDisposables.get(workspaceFolder)?.forEach(d => d.dispose())
				folderDisposables.delete(workspaceFolder)
			}
		}
	})

	if (workspace.workspaceFolders){
		workspace.workspaceFolders.forEach(async (workspaceFolder: WorkspaceFolder) => {
			folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder))
		})
	}
}

async function getProjectConfig(workspaceFolder: WorkspaceFolder): Promise<ProjectConfig | null> {
	let projectFileUri: Uri = Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"))
	let projectConfig: ProjectConfig | null = null
	try {
		let projectConfigText = await workspace.fs.readFile(projectFileUri)
		projectConfig = {}
		if (projectConfigText){
			projectConfig = JSON.parse(projectConfigText.toString())
		}
	} catch (error) {
		console.log('no project file in workspace');
	}
	return projectConfig
}

async function updateLibraryFunctions(uri: Uri, project: ConfiguredProject): Promise<BrSourceDocument | undefined> {
	try {
		const libText = await workspace.fs.readFile(uri)
		if (libText){
			const newDoc = new BrSourceDocument(uri, libText.toString(), project)
			return newDoc
		}
	} catch {
		window.showWarningMessage(`Library source not found ${uri.fsPath}`)
	}
}

async function startWatchingSource(workspaceFolder: WorkspaceFolder, project: ConfiguredProject): Promise<Disposable[]> {
	const watchers: Disposable[] = []
	const folderPattern = new RelativePattern(workspaceFolder, SOURCE_GLOB)
	const sourceFiles = await workspace.findFiles(folderPattern)

	for (const source of sourceFiles) {
		const sourceLib = await updateLibraryFunctions(source, project)
		if (sourceLib){
			project.libraries.set(source.toString(), sourceLib)
		}
	}

	const codeWatcher = workspace.createFileSystemWatcher(folderPattern)
	codeWatcher.onDidChange(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, project)
		if (sourceLib){
			for (const [uri] of project.libraries) {
				if (uri === sourceUri.toString()){
					project.libraries.set(sourceUri.toString(), sourceLib)
				}
			}
		}
	}, undefined, watchers)

	codeWatcher.onDidDelete(async (sourceUri: Uri) => {
		project.libraries.delete(sourceUri.toString())
	})

	codeWatcher.onDidCreate(async (sourceUri: Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, project)
		if (sourceLib){
			project.libraries.set(sourceUri.toString(), sourceLib)
		}
	})

	return watchers
}

async function startWatchingWorkpaceFolder(context: ExtensionContext, workspaceFolder: WorkspaceFolder): Promise<Disposable[]> {
	const disposables: Disposable[] = []
	const projectFilePattern = new RelativePattern(workspaceFolder, "br-project.json")
	const projectWatcher = workspace.createFileSystemWatcher(projectFilePattern)

	let watchers: Disposable[] = []

	projectWatcher.onDidChange(async (uri: Uri) => {
		const projectConfig = await getProjectConfig(workspaceFolder)
		if (projectConfig){
			const project = new ConfiguredProject(projectConfig)
			ConfiguredProjects.set(workspaceFolder, project)
		}
	}, undefined, disposables)

	projectWatcher.onDidDelete((uri: Uri) => {
		ConfiguredProjects.delete(workspaceFolder)
		watchers.forEach(d => d.dispose())
		watchers = []
	}, undefined, disposables)

	projectWatcher.onDidCreate(async (uri: Uri) => {
		const projectConfig = await getProjectConfig(workspaceFolder)
		if (projectConfig){
			const project = new ConfiguredProject(projectConfig)
			ConfiguredProjects.set(workspaceFolder, project)
			watchers = await startWatchingSource(workspaceFolder, project)
		}
	}, undefined, disposables)

	const projectConfig = await getProjectConfig(workspaceFolder)
	if (projectConfig){
		const project = new ConfiguredProject(projectConfig)
		ConfiguredProjects.set(workspaceFolder, project)
		watchers = await startWatchingSource(workspaceFolder, project)
	}

	return disposables.concat(watchers)
}

