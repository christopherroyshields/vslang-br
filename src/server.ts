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
	(_textDocumentPosition: CompletionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		
		let internalFunctionCompletions: CompletionItem[] = getFunctionCompletions()
		return internalFunctionCompletions
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		for (let itemIndex = 0; itemIndex < br.stringFunctions.length; itemIndex++) {
			const stringFunctionItem = br.stringFunctions[itemIndex];
			let sig = br.generateFunctionSignature(stringFunctionItem);
			if (item.label == stringFunctionItem.name){
				item.labelDetails = {
					detail: sig,
					description: stringFunctionItem.description
				},
				item.detail = stringFunctionItem.name + br.generateFunctionSignature(stringFunctionItem)
				item.documentation = stringFunctionItem.documentation
				break
			}
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

function getFunctionDetails(preText: string): SignatureHelp | undefined {

	// strip functions with params
	if (preText){
		// remove literals first
		preText = preText.replace(STRING_LITERALS, "")
		preText = stripBalancedFunctions(preText)
		let context: RegExpExecArray | null = FUNCTION_CALL_CONTEXT.exec(preText)
		if (context && context.groups && !context.groups.isDef){

			let internalFunction = br.getFunctionByName(context.groups.name)
			if (internalFunction){

				let params: ParameterInformation[] = []
				if (internalFunction && internalFunction.params){
					for (let paramIndex = 0; paramIndex < internalFunction.params.length; paramIndex++) {
						let el = internalFunction.params[paramIndex];
						params.push({
							label: el.name,
							documentation: el.documentation
						})
					}
				}
	
				const sig: SignatureInformation = {
					label: internalFunction.name + br.generateFunctionSignature(internalFunction),
					parameters: [...params],
					activeParameter: context.groups.params?.split(',').length - 1
				}
	
				const sigHelp: SignatureHelp = {
					signatures: [sig],
					activeSignature: 0
				}
	
				return sigHelp;
			}
		} else {
			// not in function call with parameters
			return
		}
	}

	// if (name.substring(0,2).toLowerCase() === "fn"){
	// 	findFunctionByName(name, editor.getText(), call)
	// } else {
	// 	let functions = []
	// 	functions = internalFunctions
	// 	for (var i = 0; i < functions.length; i++) {
	// 		if (functions[i].text.toLowerCase() === name.toLowerCase() && functions[i].params && functions[i].params.length > 0){
	// 			call.name = functions[i].text
	// 			call.params = functions[i].params
	// 			break
	// 		}
	// 	}
	// }
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
			sigHelp = getFunctionDetails(doctext)
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
			data: internalFunction
		}

		functionCompletions.push(completion)		
	})
	return functionCompletions
}