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

const SOURCE_GLOB = '**/*.{brs,wbs}'
const ConfiguredProjects = new Map<vscode.WorkspaceFolder, ConfiguredProject>()

const signatureHelpProvider = new BrSignatureHelpProvider(ConfiguredProjects)
const hoverProvider = new BrHoverProvider(ConfiguredProjects)
const libLinkListProvider = new LibLinkListProvider(ConfiguredProjects)

export function activate(context: vscode.ExtensionContext) {
	
	activateLexi(context)

	activateNextPrev(context)

	activateClient(context)

	activateWorkspaceFolders(context)

	vscode.languages.registerSignatureHelpProvider({
		language: "br",
		scheme: "file"
	}, signatureHelpProvider, "(", ",")

	vscode.languages.registerHoverProvider({
		language: "br",
		scheme: "file"
	}, hoverProvider)

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, libLinkListProvider, ":", ",", " ")
	
	
	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) => {
			const completionItems: vscode.CompletionList<vscode.CompletionItem> = new vscode.CompletionList();

			const line = doc.getText(new vscode.Range(doc.lineAt(position).range.start, position));
			const ISLIBRARY_LITERAL = /library\s+(release\s*,)?(\s*nofiles\s*,)?\s*("|')$/gi
			if (ISLIBRARY_LITERAL.test(line)){
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
				if (workspaceFolder){
					const project = ConfiguredProjects.get(workspaceFolder)
					if (project){
						const searchPath = getSearchPath(workspaceFolder, project)
						for (const [uri, lib] of project.libraries) {
							if (lib.uri.fsPath.indexOf(searchPath.fsPath) === 0){
								const parsedPath = path.parse(lib.uri.fsPath.substring(searchPath.fsPath.length + 1))
								const libPath = path.join(parsedPath.dir, parsedPath.name)
								const itemLabel: vscode.CompletionItemLabel = {
									label: libPath,
									detail: parsedPath.ext.substring(0,parsedPath.ext.length-1)
								}
								completionItems.items.push({
									label: itemLabel
								})
							}
						}				
					}
				}
			}

			return completionItems
		}
	}, "\"", "'")

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] => {
			const completionItems: vscode.CompletionItem[] = []

			const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
			if (workspaceFolder){
				const project = ConfiguredProjects.get(workspaceFolder)
				if (project){
					for (const [uri, lib] of project.libraries) {
						if (uri !== doc.uri.toString()){
							for (const fn of lib.libraryList){
								if (fn.isLibrary){
									completionItems.push({
										kind: CompletionItemKind.Function,
										label: {
											label: fn.name,
											detail: ' (library function)',
											description: path.basename(lib.uri.fsPath)
										},
										detail: `(library function) ${fn.name}${fn.generateSignature()}`,
										documentation: new vscode.MarkdownString(fn.getAllDocs())
									})
								}
							}
						}
					}
				}
			}

			const source = new SourceLibrary(doc.uri, doc.getText())
			for (const fn of source.libraryList) {
				completionItems.push({
					kind: CompletionItemKind.Function,
					label: {
						label: fn.name,
						detail: ` (${fn.isLibrary ? 'library' : 'local'} function)`
					},
					detail: `(${fn.isLibrary ? 'library' : 'local'} function) ${fn.name}${fn.generateSignature()}`,
					documentation: new vscode.MarkdownString(fn.getAllDocs())
				})
			}

			return completionItems
		}
	})

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

