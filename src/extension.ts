import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import { Statements } from './statements';
import { CompletionItemKind, CompletionItemLabelDetails } from 'vscode-languageclient';
import path = require('path');
import { BrFunction, generateFunctionSignature, UserFunction, UserFunctionParameter } from './completions/functions';
import { BrParamType } from './types/BrParamType';
import { DocComment } from './types/DocComment';

export function activate(context: vscode.ExtensionContext) {
	
	activateLexi(context)

	activateNextPrev(context)

	activateClient(context)

	activateWorkspaceFolders(context)

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] => {
			const completionItems: vscode.CompletionItem[] = []

			const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)
			if (workspaceFolder){
				const config = ProjectConfigs.get(workspaceFolder)
				if (config?.libraries){
					for (const [uri, lib] of config.libraries) {
						for (const fn of lib){
							completionItems.push({
								kind: CompletionItemKind.Function,
								label: {
									label: fn.name,
									detail: ' (library function)',
									description: path.basename(uri.fsPath)
								},
								detail: `(library function) ${fn.name}${fn.generateSignature()}`,
								documentation: new vscode.MarkdownString(fn.getAllDocs())
							})
						}
					}
				}
			}

			let userFunctions: UserFunction[]
			userFunctions = parseFunctionsFromSource(doc.getText(), false)
			for (let fnIndex = 0; fnIndex < userFunctions.length; fnIndex++) {
				const fn = userFunctions[fnIndex];
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
	let functions: UserFunction[] = []
	let matches = sourceText.matchAll(FIND_COMMENTS_AND_FUNCTIONS)
	let match = matches.next();
	while (!match.done) {
		if (match.value.groups?.name && (!librariesOnly || match.value.groups?.isLibrary)){
			
			const lib: UserFunction = new UserFunction(match.value.groups.name)

			let fnDoc: DocComment | undefined
			if (match.value.groups.comments) {
				fnDoc = DocComment.parse(match.value.groups.comments)
				lib.documentation = fnDoc.text
			}
			
			if (match.value.groups.params){
				lib.params = []

				// remove line continuations
				const params = match.value.groups.params.replace(LINE_CONTINUATIONS, "")
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
		match = matches.next();
	}
	return functions
}

interface ProjectConfigJson {
	globalIncludes?: string[]
}

interface ProjectConfig {
	libraries?: Map<vscode.Uri, UserFunction[]>
}

const ProjectConfigs = new Map<vscode.WorkspaceFolder, ProjectConfig>()
const GlobalLibraries = new Map<vscode.Uri, UserFunction[]>()

/**
 * Sets up monitoring of project configuration
 * @param context extension context
 */
function activateWorkspaceFolders(context: vscode.ExtensionContext) {
	if (vscode.workspace.workspaceFolders){
		vscode.workspace.workspaceFolders.forEach(async (workspaceFolder: vscode.WorkspaceFolder) => {
			let projectWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, 'br-project.json'))
			updateGlobalLibraries(workspaceFolder)
			projectWatcher.onDidChange((uri: vscode.Uri) => {
				updateGlobalLibraries(workspaceFolder)
			}, undefined, context.subscriptions)
			projectWatcher.onDidCreate((uri: vscode.Uri) => {
				updateGlobalLibraries(workspaceFolder)
			}, undefined, context.subscriptions)
			projectWatcher.onDidDelete((uri: vscode.Uri) => {
				ProjectConfigs.delete(workspaceFolder)
			}, undefined, context.subscriptions)
		})
	}
}

async function updateGlobalLibraries(workspaceFolder: vscode.WorkspaceFolder){
	let projectFileUri: vscode.Uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"))

	ProjectConfigs.delete(workspaceFolder)

	try {
		let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri)
		if (projectConfigText){
			let config: ProjectConfigJson = JSON.parse(projectConfigText.toString())
			const projectConfig: ProjectConfig = {}
			ProjectConfigs.set(workspaceFolder, projectConfig)
			if (config.globalIncludes?.length){
				config.globalIncludes.forEach(async (filePath) => {
					let uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath))
					try {
						let libText = await vscode.workspace.fs.readFile(uri)
						if (libText){
							if (!projectConfig.libraries) projectConfig.libraries = new Map<vscode.Uri, UserFunction[]>()
							projectConfig.libraries.set(
								uri, 
								parseFunctionsFromSource(
									libText.toString()))
						}
					} catch {
						vscode.window.showWarningMessage(`Global library not found ${uri.fsPath}`)
					}
				})
			}					
		}
	} catch (error) {
		console.log('no project file in workspace');
	}		
}