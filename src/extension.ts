import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import { Statements } from './statements';
import { CompletionItemKind, CompletionItemLabelDetails } from 'vscode-languageclient';
import { CompletionItemLabel } from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { BrFunction, generateFunctionSignature, UserFunction } from './completions/functions';
import G = require('glob');

interface ProjectConfig {
	globalIncludes: string[]
}

interface LibraryFile {
	uri: vscode.Uri,
	functions: BrFunction[]
}

const ProjectConfigs = new Map<vscode.WorkspaceFolder, ProjectConfig>()
const GlobalLibraries = new Map<vscode.Uri, BrFunction[]>()

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
									GlobalLibraries.set(uri, parseFunctionsFromSource({
										text: libText.toString(),
										librariesOnly: true
									}))
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
		provideCompletionItems: (doc: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] => {
			const completionItems: vscode.CompletionItem[] = []
			for (const [uri, lib] of GlobalLibraries) {
				for (const fn of lib){
					completionItems.push({
						kind: CompletionItemKind.Function,
						label: {
							label: fn.name,
							description: path.basename(uri.fsPath)
						},
						detail: `(function) ${fn.name}${generateFunctionSignature(fn)}`,
						documentation: 'documentation'
					})
				}
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


interface CommentTag {
	tag: string
	name: string
	desc: string
}

class DocComment extends Object {
	text?: string
	params: Map<string, string> = new Map<string,string>()
	static textSearch: RegExp = /^[\s\S]*?(?=@|$)/
	static paramSearch: RegExp = /@(?<tag>param)[ \t]+(?<name>(?:mat\s+)?\w+\$?)?(?:[ \t]+(?<desc>.*))?/gmi
	constructor() {
		super();
	}

	/**
	 * Function removes leading asterisk from comment lines
	 * @param comments
	 * @returns comments without asterisk
	 */
	static cleanComments(comments: string): string {
		return comments.replace(/^\s*\*\s/gm, "").trim()
	}

	static parse(commentText: string): DocComment {
		const docComment = new DocComment()
		
		// freeform text at beginning
		const textMatch = DocComment.textSearch.exec(commentText)
		if (textMatch != null){
			docComment.text = DocComment.cleanComments(textMatch[0])
		}

		// params
		const tagMatches = commentText.matchAll(DocComment.paramSearch)
		for (const tagMatch of tagMatches){
			if (tagMatch.groups){
				docComment.params.set(tagMatch.groups.name, tagMatch.groups.desc)
			}
		}
		return docComment
	}
}


const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))|(?<multiline_comment>\/\*.*\*\/)/gi
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?:mat\s+)?[\w$]+(?:\s*)(?:\*\s*(?<length>\d+))?)\s*(?<delimiter>;|,)?/gi
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g

interface ParseFunctionOptions {
	text: string,
	librariesOnly: boolean
}

function parseFunctionsFromSource(opt: ParseFunctionOptions): UserFunction[] {
	let functions: UserFunction[] = []
	let matches = opt.text.matchAll(FIND_COMMENTS_AND_FUNCTIONS)
	let match = matches.next();
	while (!match.done) {
		if (match.value.groups?.name && match.value.groups?.isLibrary){
			
			const lib: UserFunction = {
				name: match.value.groups.name
			}

			let fnDoc: DocComment | undefined
			if (match.value.groups.comments) {
				fnDoc = DocComment.parse(match.value.groups.comments)
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
						lib.params.push({
							name: paramMatch.groups.name
						})
						if (paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';'){
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
