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
import { createHoverFromFunction, getSearchPath, isComment, stripBalancedFunctions } from './util/common';
import { ConfiguredProject } from './class/ConfiguredProject';
import { UserFunction } from './class/UserFunction';
import { UserFunctionParameter } from './class/UserFunctionParameter';
import { ProjectConfig } from './interface/ProjectConfig';
import { SourceLibrary } from './class/SourceLibrary';

const SOURCE_GLOB = '**/*.{brs,wbs}'
const STRING_LITERALS = /(}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g
const FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i

const ConfiguredProjects = new Map<vscode.WorkspaceFolder, ConfiguredProject>()

function sigHelpProvider(doc: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.SignatureHelp | undefined {
	const doctext = doc.getText(new vscode.Range(doc.positionAt(0), position))
	const sigHelp = getFunctionDetails(doctext, doc)
	if (sigHelp) return sigHelp
}

function getFunctionDetails(preText: string, doc: vscode.TextDocument): vscode.SignatureHelp | undefined {

	// strip functions with params
	if (preText){
		// remove literals first
		preText = preText.replace(STRING_LITERALS, "")
		preText = stripBalancedFunctions(preText)
		let context: RegExpExecArray | null = FUNCTION_CALL_CONTEXT.exec(preText)
		if (context && context.groups && !context.groups.isDef){

			const sigHelp: vscode.SignatureHelp = {
				signatures: [],
				activeSignature: 0,
				activeParameter: 0
			}

			if (context.groups.name.substring(0,2).toLocaleLowerCase()==="fn"){
				const localLibs = parseFunctionsFromSource(doc.getText(), false)
				for (const fn of localLibs) {
					if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()){
						const params: vscode.ParameterInformation[] = []
						if (fn && fn.params){
							for (const param of fn.params) {
								params.push({
									label: param.name,
									documentation: param.documentation
								})
							}
						}
		
						const sigInfo = new vscode.SignatureInformation(fn.name + generateFunctionSignature(fn), new vscode.MarkdownString(fn.documentation))
						sigInfo.parameters = params
						sigInfo.activeParameter = context.groups.params?.split(',').length - 1
						sigHelp.signatures.push(sigInfo)
					}
				}

				const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
				if (workspaceFolder){
					const project = ConfiguredProjects.get(workspaceFolder)
					if (project){
						for (const [libUri,lib] of project.libraries) {
							if (libUri !== doc.uri.toString()){
								for (const fn of lib.libraryList) {
									if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()){
										const params: vscode.ParameterInformation[] = []
										if (fn && fn.params){
											for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
												const el = fn.params[paramIndex];
												params.push({
													label: el.name,
													documentation: el.documentation
												})
											}
										}
						
										const sigInfo = new vscode.SignatureInformation(fn.name + generateFunctionSignature(fn))
										sigInfo.parameters = params
										sigInfo.activeParameter = context.groups.params?.split(',').length - 1
										sigHelp.signatures.push(sigInfo)
									}
								}
							}
						}
					}
				}
			} else {
				const internalFunctions = getFunctionsByName(context.groups.name)
				if (internalFunctions){
					for (const fn of internalFunctions) {
						let params: vscode.ParameterInformation[] = []
						if (fn && fn.params){
							for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
								let el = fn.params[paramIndex];
								params.push({
									label: el.name,
									documentation: el.documentation
								})
							}
						}
			
						sigHelp.signatures.push({
							label: fn.name + generateFunctionSignature(fn),
							parameters: params,
							activeParameter: context.groups.params?.split(',').length - 1
						})
					}
				}
			}

			return sigHelp
			
		} else {
			// not in function call with parameters
			return
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	
	activateLexi(context)

	activateNextPrev(context)

	activateClient(context)

	activateWorkspaceFolders(context)

	vscode.languages.registerSignatureHelpProvider({
		language: "br",
		scheme: "file"
	}, {
		provideSignatureHelp: sigHelpProvider
	}, "(", ",")

	vscode.languages.registerHoverProvider({
		language: "br",
		scheme: "file"
	}, {
		provideHover: (doc: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover | undefined => {

			const doctext = doc.getText()
			if (isComment(position, doctext, doc)){
				return			
			} else {
				const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/);
				if (wordRange){
					const word = doc.getText(wordRange)
					if (word){
						if (word.substring(0,2).toLowerCase() == "fn"){
							
							// local functions
							const localLibs = parseFunctionsFromSource(doc.getText(), false)
							for (const fn of localLibs) {
								if (fn.name.toLowerCase() == word){
									const hover = createHoverFromFunction(fn)
									hover.range = wordRange
									return hover
								}
							}
							
							// library functions
							const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
							if (workspaceFolder){
								const project = ConfiguredProjects.get(workspaceFolder)
								if (project){
									for (const [uri,lib] of project.libraries) {
										for (const fn of lib.libraryList) {
											if (fn.name.toLowerCase() === word){
												const hover = createHoverFromFunction(fn)
												hover.range = wordRange
												return hover
											}
										}
									}
								}
							}
						}	else {
							// system functions
							const fn = getFunctionByName(word)
							if (fn){
								const hover = createHoverFromFunction(fn)
								hover.range = wordRange
								return hover
							}
						}					
					}

					// local functions
				}
			}
		
		}
	})

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) => {
			const completionItems: vscode.CompletionList<vscode.CompletionItem> = new vscode.CompletionList();

			if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter){
				const line = doc.getText(new vscode.Range(doc.lineAt(position).range.start, position));
				const ISLIBRARY_LINKAGE_LIST = /library(\s+(release\s*,)?(\s*nofiles\s*,)?\s*(?<libPath>"[\w\\]+"|'[\w\\]+')?)\s*:\s*(?<fnList>[a-z_, $]*)?$/i
				let match = line.match(ISLIBRARY_LINKAGE_LIST)
				if (match?.groups){
					const libPath = match.groups.libPath.replace(/'|"/g, '')
					const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
					if (workspaceFolder){
						const project = ConfiguredProjects.get(workspaceFolder)
						if (project){
							for (const [uri,lib] of project.libraries) {
								if (lib.linkPath.toLowerCase() == libPath.toLowerCase()){
									for (const fn of lib.libraryList) {
										if (match.groups.fnList){
											const lineSearch = new RegExp("\\b"+fn.name.replace("$","\\$")+"(,|\s|$)", "i")
											if (!lineSearch.test(match.groups.fnList)){
												completionItems.items.push({
													label: fn.name
												})
											}
										} else {
											completionItems.items.push({
												label: fn.name
											})
										}
									}
								}
							}
						}
					}
				}
			}


			return completionItems
		}
	}, ":", ",", " ")
	
	
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
					if (project?.config?.globalIncludes){
						for (const globalInclude of project.config.globalIncludes) {
							const searchPath = getSearchPath(workspaceFolder, project)
							const globalUri = vscode.Uri.file(path.join(searchPath.fsPath, globalInclude))
							for (const [uri, lib] of project.libraries) {
								if (uri !== doc.uri.toString() && globalUri.toString() === uri){
									for (const fn of lib.libraryList){
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
			}

			const userFunctions = parseFunctionsFromSource(doc.getText(), false)
			for (const fn of userFunctions) {
				completionItems.push({
					kind: CompletionItemKind.Function,
					label: {
						label: fn.name,
						detail: ' (local function)'
					},
					detail: `(local function) ${fn.name}${fn.generateSignature()}`,
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

	console.log('Extension "vslang-br" is now active!');

}

export function deactivate() {
	deactivateClient();
}

const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][^/]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))/gi
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g

function parseFunctionsFromSource(sourceText: string, librariesOnly: boolean = true): UserFunction[] {
	const functions: UserFunction[] = []
	let matches = sourceText.matchAll(FIND_COMMENTS_AND_FUNCTIONS)
	for (const match of matches) {
		if (match.groups?.name && (!librariesOnly || match.groups?.isLibrary)){
			
			const lib: UserFunction = new UserFunction(match.groups.name)

			let fnDoc: DocComment | undefined
			if (match.groups.comments) {
				fnDoc = DocComment.parse(match.groups.comments)
				lib.documentation = fnDoc.text
			}
			
			if (match.groups.params){
				lib.params = []

				// remove line continuations
				const params = match.groups.params.replace(LINE_CONTINUATIONS, "")
				const it = params.matchAll(PARAM_SEARCH)

				let isOptional = false
				for (const paramMatch of it) {
					if (paramMatch.groups && paramMatch.groups.name){
						
						if (paramMatch.groups.name.trim() == "___"){
							break
						}

						const libParam: UserFunctionParameter = new UserFunctionParameter()
						libParam.name = paramMatch.groups.name
						libParam.isReference = paramMatch.groups.isReference ? true : false
						libParam.isOptional = isOptional

						if (paramMatch.groups.isString){
							if (paramMatch.groups.isArray){
								libParam.type = BrParamType.stringarray
							} else {
								libParam.type = BrParamType.string
								if (paramMatch.groups.length){
									libParam.length = parseInt(paramMatch.groups.length)
								}
							}
						} else {
							if (paramMatch.groups.isArray){
								libParam.type = BrParamType.numberarray
							} else {
								libParam.type = BrParamType.number
							}
						}
						
						if (fnDoc?.params){
							libParam.documentation = fnDoc.params.get(paramMatch.groups.name)
						}

						lib.params.push(libParam)
						
						if (!isOptional && paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';'){
							isOptional = true
						}
					}
				}
			}
			functions.push(lib)
		}
	}
	return functions
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
			// if (projectConfig?.globalIncludes?.length){
			// 	for (const globalInclude of projectConfig.globalIncludes) {
			// 		const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, globalInclude))
			// 		const globalLib = GlobalLibraries.get(uri)
			// 		if (globalLib){
			// 			if (!projectConfig.libraries) projectConfig.libraries = new Map()
			// 			const globalLib = GlobalLibraries.get(uri)
			// 			projectConfig.libraries.set(uri, globalLib ?? [])
			// 		}
			// 		// if (projectConfig?.libraries) await updateLibraryFunctions(uri)

			// 	}
			// }					
		}
	} catch (error) {
		console.log('no project file in workspace');
	}
	return projectConfig
}

async function updateLibraryFunctions(uri: vscode.Uri): Promise<UserFunction[] | null> {
	let libs: UserFunction[] | null = null
	try {
		let libText = await vscode.workspace.fs.readFile(uri)
		if (libText){
			libs = parseFunctionsFromSource(libText.toString())
		}
	} catch {
		vscode.window.showWarningMessage(`Global library not found ${uri.fsPath}`)
	}
	return libs
}

function updateWorkspaceCode(uri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder) {

}

async function startWatchingSource(workspaceFolder: vscode.WorkspaceFolder, project: ConfiguredProject): Promise<vscode.Disposable[]> {
	const watchers: vscode.Disposable[] = []
	const folderPattern = new vscode.RelativePattern(workspaceFolder, SOURCE_GLOB)
	const sourceFiles = await vscode.workspace.findFiles(folderPattern)

	for (const source of sourceFiles) {
		const sourceLibs = await updateLibraryFunctions(source)
		if (sourceLibs){
			const sourceLib = new SourceLibrary(source, sourceLibs, workspaceFolder, project)
			project.libraries.set(source.toString(), sourceLib)
		}
	}

	const codeWatcher = vscode.workspace.createFileSystemWatcher(folderPattern)
	codeWatcher.onDidChange(async (source: vscode.Uri) => {
		const sourceLibs = await updateLibraryFunctions(source)
		if (sourceLibs){
			for (const [uri] of project.libraries) {
				if (uri === source.toString()){
					const sourceLib = new SourceLibrary(source, sourceLibs, workspaceFolder, project)
					project.libraries.set(source.toString(), sourceLib)
				}
			}
		}
	}, undefined, watchers)

	codeWatcher.onDidDelete(async (source: vscode.Uri) => {
		for (const [uri] of project.libraries) {
			if (uri === source.toString()){
				project.libraries.delete(uri)
			}
		}
	})

	codeWatcher.onDidCreate(async (source: vscode.Uri) => {
		const sourceLibs = await updateLibraryFunctions(source)
		if (sourceLibs){
			const sourceLib = new SourceLibrary(source, sourceLibs, workspaceFolder, project)
			project.libraries.set(source.toString(), sourceLib)
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

