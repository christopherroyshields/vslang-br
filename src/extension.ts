import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import { Statements } from './statements';
import { CompletionItemLabelDetails } from 'vscode-languageclient';
import { CompletionItemLabel } from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { InternalFunction } from './completions/functions';
import G = require('glob');

interface ProjectConfig {
	globalIncludes: string[]
}

interface LibraryFile {
	uri: vscode.Uri,
	functions: InternalFunction[]
}

const ProjectConfigs = new Map<vscode.WorkspaceFolder, ProjectConfig>()
const GlobalLibraries = new Map<vscode.Uri, LibraryFile>()

interface ParseFunctionOptions {
	text: string,
	librariesOnly: boolean
}

export function activate(context: vscode.ExtensionContext) {
	
	activateLexi(context);

	activateNextPrev(context);

	activateClient(context);

	if (vscode.workspace.workspaceFolders?.length){
		vscode.workspace.workspaceFolders.forEach(async (workspaceFolder: vscode.WorkspaceFolder) => {
			let projectFileUri: vscode.Uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"))
			try {
				let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri)
				if (projectConfigText){
					let config: ProjectConfig = JSON.parse(projectConfigText.toString())
					ProjectConfigs.set(workspaceFolder, config)
					if (config.globalIncludes?.length){
						config.globalIncludes.forEach(async (filePath) => {
							let uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath))
							try {
								let libText = await vscode.workspace.fs.readFile(uri)
								if (libText){
									GlobalLibraries.set(uri, {
										uri: uri,
										functions: parseFunctionsFromSource({
											text: libText.toString(),
											librariesOnly: true
										})
									})
								}
							} catch {
								console.log('global library not found');
							}
						})
					}					
				}
			} catch (error) {
				console.log('no project file in workspace');
			}
		})
	}

	vscode.languages.registerCompletionItemProvider({
		language: "br",
		scheme: "file"
	}, {
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]> => {

			let completionItems: vscode.CompletionItem[] = []
			return Promise.resolve(completionItems)
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

const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?<comments>\/\*[\s\S]*?\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))|(?<multiline_comment>\/\*.*\*\/)/gi
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?:mat\s+)?[\w$]+(?:\s*)(?:\*\s*(?<length>\d+))?)\s*(?<delimiter>;|,)?/gi
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g

function parseFunctionsFromSource(opt: ParseFunctionOptions): InternalFunction[] {
	let functions: InternalFunction[] = []
	let matches = opt.text.matchAll(FIND_COMMENTS_AND_FUNCTIONS)
	let match = matches.next();
	while (!match.done) {
		if (match.value.groups?.name && match.value.groups?.isLibrary){
			
			const lib: InternalFunction = {
				name: match.value.groups.name
			}
			
			if (match.value.groups.params){
				lib.params = []

				// remove line continuations
				const params = match.value.groups.params.replace(LINE_CONTINUATIONS, "")
				const it = params.matchAll(PARAM_SEARCH)

				let isOptional = false
				for (const paramMatch of it) {
					if (paramMatch.groups && paramMatch.groups.name){
						lib.params.push({
							name: paramMatch.groups.name
						})
						if (paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';'){
							isOptional = true
						}
						if (paramMatch.groups.name.trim() == "___"){
							break
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
