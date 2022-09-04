/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	InsertTextFormat,
	CompletionList,
	InsertTextMode,
	CompletionItemLabelDetails,
	SignatureHelp,
	CompletionParams,
	SignatureHelpParams,
	SignatureInformation,
	ParameterInformation
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as br from './completions/functions';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true
			},
			signatureHelpProvider: {
				triggerCharacters: ['('],
				retriggerCharacters: [',']
			}
		}
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	 if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface UserServerSettings {
	maxNumberOfProblems: 100
	completions: {
		includeFileio: true
	}
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: UserServerSettings = { 
	maxNumberOfProblems: 100,
	completions: {
		includeFileio: true
	}
};

let globalSettings: UserServerSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<UserServerSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <UserServerSettings>(
			(change.settings.languageServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
	// documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<UserServerSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

const userFunctions: br.UserFunction[] = []

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	// validateTextDocument(change.document);
});


async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: CompletionParams): Promise<CompletionItem[]> => {
		let completions = getCompletions(_textDocumentPosition);
		return completions
	}
);

async function getCompletions(params: CompletionParams): Promise<CompletionItem[]> {
	let completions: CompletionItem[] = []
	let doc = documents.get(params.textDocument.uri)
	
	if (doc){
		completions = completions.concat(getLocalUserFunctionCompletions(doc));
		completions = completions.concat(getFunctionCompletions())
	}

	return Promise.resolve(completions)
}

function getLocalUserFunctionCompletions(doc: TextDocument): CompletionItem[] {
	let completionList: CompletionItem[] = []
	let userFunctions: br.UserFunction[]
	userFunctions = getUserFunctionsFromDocument(doc)
	for (let fnIndex = 0; fnIndex < userFunctions.length; fnIndex++) {
		const fn = userFunctions[fnIndex];
		completionList.push({
			label: fn.name,
			kind: CompletionItemKind.Function,
			data: fn
		})		
	}
	return completionList
}

const FNSEARCH = /def.*?(?:\)|=)/ig
const FNPARSE = /def\s*(?<name>fn\w*\$?)\s*(?:\*(?<length>\d+)\s*)?(?:\((?<params>[a-z0-9 *$,&;_]*?)\))?/i
const PARAM_SEARCH = /&?[\w$]+\s*[\w]*\$?\*?\d*/g

function getUserFunctionsFromDocument(doc: TextDocument): br.UserFunction[] {
	let docText: string = doc.getText()
	docText = docText.replace(STRING_LITERALS, "");
	let fnFound: RegExpExecArray | null
	let fnList: br.UserFunction[] = []

	while ((fnFound = FNSEARCH.exec(docText)) !== null) {
		let fnParts: RegExpExecArray | null = FNPARSE.exec(fnFound[0])
		if (fnParts && fnParts.groups && fnParts.groups.name){
			let comDocs = getCommentDoc(fnParts.groups.name, docText)
			const fn: br.UserFunction = {
				name: fnParts.groups.name,
				uri: doc.uri,
				documentation: comDocs?.text,
				description: 'User Function',
				params: []
			}

			if (fnParts.groups.params){
				let paramMatch: RegExpExecArray | null
				while ((paramMatch = PARAM_SEARCH.exec(fnParts.groups.params)) !== null) {
					let fnParam: br.FunctionParameter = {
						name: paramMatch[0]
					}
					if (comDocs && comDocs.params){
						for (let paramDocIndex = 0; paramDocIndex < comDocs.params.length; paramDocIndex++) {
							const paramDoc = comDocs.params[paramDocIndex];
							if (paramDoc.name === fnParam.name.replace(/\*\d+/,"")) {
								fnParam.documentation = paramDoc.desc
							}
						}
					}
					fn.params?.push(fnParam)
				}
			}

			fnList.push(fn)
		}
	}
	return fnList
}

interface CommentTag {
	tag: string
	name: string
	desc: string
}

class DocComment extends Object {
	text?: string
	params: CommentTag[] = []
	returns?: CommentTag
	static paramSearch: RegExp = /@(?<tag>param)[ \t]+(?<name>(?:mat\s+)?\w+\$?)?(?:[ \t]+(?<desc>.*))?/gmi
	
	/**
	 * @param commentText Full text of comment
	 */
	constructor(commentText: string) {
		super()
		this.parse(commentText)
		this.text = this.cleanComments(commentText)
	}

	cleanComments(comments: string): string {
		comments = comments.replace(DocComment.paramSearch, "")
		return comments.replace(/^\s*\*/gm, "").trim()
	}
	
	/**
	 * Parse tags from text 
	 * @param commentText full text
	 */
	parse(commentText: string) {
		let tagMatch: RegExpExecArray | null
		while ((tagMatch = DocComment.paramSearch.exec(commentText)) !== null){
			if (tagMatch.groups){
				this.params.push({
					tag: tagMatch.groups.tag,
					name: tagMatch.groups.name,
					desc: tagMatch.groups.desc
				})
			}
		}
	}
}

const BRDOC_COMMENTS = /\/\*(?<comments>([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*)\*+\/\r?\n(\n|\s)*def\s+(library\s+)?(?<name>\w+\$?)/gi;

function getCommentDoc( fnName: string, docText: string): DocComment | undefined {
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = BRDOC_COMMENTS.exec(docText)) !== null) {
		if (blockMatch.groups?.name === fnName){
			let docComment: DocComment = new DocComment(blockMatch.groups.comments)
			return docComment
		}
	}
	return
}

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		let sig = br.generateFunctionSignature(item.data)
		if (item.kind === CompletionItemKind.Function){
			item.labelDetails = {
				detail: sig,
				description: item.data.description
			}
			item.detail = item.data.name + br.generateFunctionSignature(item.data)
			item.documentation = item.data.documentation
		}
		return item;
	}
);

const CONTAINS_BALANCED_FN = /[a-zA-Z][\w]*\$?(\*\d+)?\([^()]*\)/g

function stripBalancedFunctions(line: string){
	if (CONTAINS_BALANCED_FN.test(line)){
		line = line.replace(CONTAINS_BALANCED_FN, "")
		line = stripBalancedFunctions(line)
	}
	return line
}

const STRING_LITERALS = /(}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g
const FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i

function getFunctionDetails(preText: string, doc: TextDocument): SignatureHelp | undefined {

	// strip functions with params
	if (preText){
		// remove literals first
		preText = preText.replace(STRING_LITERALS, "")
		preText = stripBalancedFunctions(preText)
		let context: RegExpExecArray | null = FUNCTION_CALL_CONTEXT.exec(preText)
		if (context && context.groups && !context.groups.isDef){

			let brFunctions = br.getFunctionsByName(context.groups.name) || getUserFunctionsByName(doc, context.groups.name)
			const sigHelp: SignatureHelp = {
				signatures: [],
				activeSignature: 0
			}

			for (let brFnIndex = 0; brFnIndex < brFunctions.length; brFnIndex++) {

	
				let brFunction = brFunctions[brFnIndex];

				let params: ParameterInformation[] = []
				if (brFunction && brFunction.params){
					for (let paramIndex = 0; paramIndex < brFunction.params.length; paramIndex++) {
						let el = brFunction.params[paramIndex];
						params.push({
							label: el.name,
							documentation: el.documentation
						})
					}
				}
	
				sigHelp.signatures.push({
					label: brFunction.name + br.generateFunctionSignature(brFunction),
					parameters: [...params],
					activeParameter: context.groups.params?.split(',').length - 1
				})
	
				return sigHelp;
			}
			
		} else {
			// not in function call with parameters
			return
		}
	}
}

function getUserFunctionsByName(doc: TextDocument, name: string): br.UserFunction[] {
	let docUserFunctions = getUserFunctionsFromDocument(doc)
	let matchingFunctions: br.UserFunction[] = []
	for (let fnIndex = 0; fnIndex < docUserFunctions.length; fnIndex++) {
		const userFn = docUserFunctions[fnIndex];
		if (userFn.name === name){
			matchingFunctions.push(userFn)
		}
	}
	return matchingFunctions
}


connection.onSignatureHelp(
	(params: SignatureHelpParams): SignatureHelp | undefined => {

		let doc: TextDocument | undefined = documents.get(params.textDocument.uri);
		let sigHelp: SignatureHelp | undefined

		if (doc){
			let doctext = doc.getText({ 
				start: {
					line: 0,
					character: 0
				},
				end: params.position
			})

			// console.log(doctext);
			sigHelp = getFunctionDetails(doctext, doc)
			return sigHelp
		}

		return sigHelp
	}
)

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

var completionExample: CompletionItem = {
  label: 'STR$',
  labelDetails: {
    detail: "(<number>)",
    description: "internal function"
  },
  detail: "STR$(<numeric expression>)",
  documentation: 'The Str$ internal function returns the string form of a numeric value X.',
  insertTextFormat: InsertTextFormat.Snippet,
  insertText: 'STR$',
  kind: CompletionItemKind.Method
}

function getFunctionCompletions(): CompletionItem[] {
	let functionCompletions: CompletionItem[] = []
	br.stringFunctions.forEach(internalFunction => {
		let completion: CompletionItem = {
			label: internalFunction.name,
			kind: CompletionItemKind.Function,
			data: internalFunction
		}

		functionCompletions.push(completion)		
	})
	return functionCompletions
}