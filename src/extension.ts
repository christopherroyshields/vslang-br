import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import { Statements } from './statements';
import { CompletionItemKind, CompletionItemLabelDetails, Disposable, WorkspaceFolder } from 'vscode-languageclient';
import path = require('path');
import { generateFunctionSignature, getFunctionByName, getFunctionsByName } from './completions/functions';
import { BrParamType } from './types/BrParamType';
import { DocComment } from './types/DocComment';
import { getSearchPath, isComment, stripBalancedFunctions } from './util/common';
import { ConfiguredProject } from './class/ConfiguredProject';
import { UserFunction } from './class/UserFunction';
import { UserFunctionParameter } from './class/UserFunctionParameter';
import { ProjectConfig } from './interface/ProjectConfig';
import { SourceLibrary } from './class/SourceLibrary';
import { BrSignatureHelpProvider } from './providers/BrSignatureHelpProvider';
import { BrHoverProvider } from './providers/BrHoverProvider';
import { LibLinkListProvider } from './providers/LibLinkListProvider';
import { LibPathProvider } from './providers/LibPathProvider';
import { FuncCompletionProvider } from './providers/FuncCompletionProvider';

const SOURCE_GLOB = '**/*.{brs,wbs}'
const ConfiguredProjects = new Map<vscode.WorkspaceFolder, ConfiguredProject>()

const signatureHelpProvider = new BrSignatureHelpProvider(ConfiguredProjects)
const hoverProvider = new BrHoverProvider(ConfiguredProjects)
const libLinkListProvider = new LibLinkListProvider(ConfiguredProjects)
const libPathProvider = new LibPathProvider(ConfiguredProjects)
const funcCompletionProvider = new FuncCompletionProvider(ConfiguredProjects)

export function activate(context: vscode.ExtensionContext) {
	
	activateLexi(context)

	activateNextPrev(context)

	activateClient(context)

	activateWorkspaceFolders(context)

	const sel: vscode.DocumentSelector = {
		language: "br"
	}

	vscode.languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ",")

	vscode.languages.registerHoverProvider(sel, hoverProvider)

	vscode.languages.registerCompletionItemProvider(sel, libLinkListProvider, ":", ",", " ")
	
	vscode.languages.registerCompletionItemProvider(sel, libPathProvider, "\"", "'")

	vscode.languages.registerCompletionItemProvider(sel, funcCompletionProvider)

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] => {

			let word = doc.getText(doc.getWordRangeAtPosition(position))
			let isLower = !/[A-Z]/.test(word)
			
			return Statements.map((s)=>{
				let md = new vscode.MarkdownString()
				let item: vscode.CompletionItem = {
					label: {
						label: isLower ? s.name.toLocaleLowerCase() : s.name,
						description: 'statement'
					},
					detail: s.description,
					documentation: md,
					kind: vscode.CompletionItemKind.Keyword
				}
				if (s.documentation) md.appendMarkdown(s.documentation)
				if (s.docUrl) md.appendMarkdown(` [docs...](${s.docUrl})`)
				if (s.example) md.appendCodeblock(s.example) 
				return item
			})

		}
	})
}

export function deactivate() {
	deactivateClient();
}

/**
 * Sets up monitoring of project configuration
 * @param context extension context
 */
function activateWorkspaceFolders(context: vscode.ExtensionContext) {
	const folderDisposables: Map<vscode.WorkspaceFolder, Disposable[]> = new Map()
	vscode.workspace.onDidChangeWorkspaceFolders(async ({ added, removed }: vscode.WorkspaceFoldersChangeEvent) => {
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

	if (vscode.workspace.workspaceFolders){
		vscode.workspace.workspaceFolders.forEach(async (workspaceFolder: vscode.WorkspaceFolder) => {
			folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder))
		})
	}
}

async function getProjectConfig(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectConfig | null> {
	let projectFileUri: vscode.Uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"))
	let projectConfig: ProjectConfig | null = null
	try {
		let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri)
		projectConfig = {}
		if (projectConfigText){
			projectConfig = JSON.parse(projectConfigText.toString())
		}
	} catch (error) {
		console.log('no project file in workspace');
	}
	return projectConfig
}

async function updateLibraryFunctions(uri: vscode.Uri, project: ConfiguredProject): Promise<SourceLibrary | undefined> {
	try {
		const libText = await vscode.workspace.fs.readFile(uri)
		if (libText){
			const newDoc = new SourceLibrary(uri, libText.toString(), project)
			return newDoc
		}
	} catch {
		vscode.window.showWarningMessage(`Library source not found ${uri.fsPath}`)
	}
}

async function startWatchingSource(workspaceFolder: vscode.WorkspaceFolder, project: ConfiguredProject): Promise<vscode.Disposable[]> {
	const watchers: vscode.Disposable[] = []
	const folderPattern = new vscode.RelativePattern(workspaceFolder, SOURCE_GLOB)
	const sourceFiles = await vscode.workspace.findFiles(folderPattern)

	for (const source of sourceFiles) {
		const sourceLib = await updateLibraryFunctions(source, project)
		if (sourceLib){
			project.libraries.set(source.toString(), sourceLib)
		}
	}

	const codeWatcher = vscode.workspace.createFileSystemWatcher(folderPattern)
	codeWatcher.onDidChange(async (sourceUri: vscode.Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, project)
		if (sourceLib){
			for (const [uri] of project.libraries) {
				if (uri === sourceUri.toString()){
					project.libraries.set(sourceUri.toString(), sourceLib)
				}
			}
		}
	}, undefined, watchers)

	codeWatcher.onDidDelete(async (sourceUri: vscode.Uri) => {
		project.libraries.delete(sourceUri.toString())
	})

	codeWatcher.onDidCreate(async (sourceUri: vscode.Uri) => {
		const sourceLib = await updateLibraryFunctions(sourceUri, project)
		if (sourceLib){
			project.libraries.set(sourceUri.toString(), sourceLib)
		}
	})

	return watchers
}

async function startWatchingWorkpaceFolder(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): Promise<Disposable[]> {
	const disposables: Disposable[] = []
	const projectFilePattern = new vscode.RelativePattern(workspaceFolder, "br-project.json")
	const projectWatcher = vscode.workspace.createFileSystemWatcher(projectFilePattern)

	let watchers: vscode.Disposable[] = []

	projectWatcher.onDidChange(async (uri: vscode.Uri) => {
		const projectConfig = await getProjectConfig(workspaceFolder)
		if (projectConfig){
			const project = new ConfiguredProject(projectConfig)
			ConfiguredProjects.set(workspaceFolder, project)
		}
	}, undefined, disposables)

	projectWatcher.onDidDelete((uri: vscode.Uri) => {
		ConfiguredProjects.delete(workspaceFolder)
		watchers.forEach(d => d.dispose())
		watchers = []
	}, undefined, disposables)

	projectWatcher.onDidCreate(async (uri: vscode.Uri) => {
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

