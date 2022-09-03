"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const br = require("./completions/functions");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
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
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = {
    maxNumberOfProblems: 100,
    completions: {
        includeFileio: true
    }
};
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServer || defaultSettings));
    }
    // Revalidate all open text documents
    // documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
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
const userFunctions = [];
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    // validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    // In this simple example we get the settings for every validate run.
    const settings = await getDocumentSettings(textDocument.uri);
    // The validator creates diagnostics for all uppercase words length 2 and more
    const text = textDocument.getText();
    const pattern = /\b[A-Z]{2,}\b/g;
    let m;
    let problems = 0;
    const diagnostics = [];
    while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
        problems++;
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Warning,
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
connection.onCompletion((_textDocumentPosition) => {
    let completions = getCompletions(_textDocumentPosition);
    return completions;
});
async function getCompletions(params) {
    let completions = [];
    let doc = documents.get(params.textDocument.uri);
    if (doc) {
        completions = completions.concat(getLocalUserFunctionCompletions(doc));
        completions = completions.concat(getFunctionCompletions());
    }
    return Promise.resolve(completions);
}
function getLocalUserFunctionCompletions(doc) {
    let completionList = [];
    let userFunctions;
    userFunctions = getUserFunctionsFromDocument(doc);
    for (let fnIndex = 0; fnIndex < userFunctions.length; fnIndex++) {
        const fn = userFunctions[fnIndex];
        completionList.push({
            label: fn.name,
            kind: node_1.CompletionItemKind.Function,
            data: fn
        });
    }
    return completionList;
}
function getUserFunctionsFromDocument(doc) {
    let docText = doc.getText();
    docText = docText.replace(STRING_LITERALS, "");
    const FNSEARCH = /def.*?(?:\)|=)/ig;
    const FNPARSE = /def\s*(?<name>fn\w*\$?)\s*(?:\*(?<length>\d+)\s*)?(?:\((?<params>[a-z0-9 *$,&;_]*?)\))?/i;
    let fnFound;
    let fnList = [];
    while ((fnFound = FNSEARCH.exec(docText)) !== null) {
        let fnParts = FNPARSE.exec(fnFound[0]);
        if (fnParts && fnParts.groups && fnParts.groups.name) {
            let fn = {
                name: fnParts.groups.name,
                uri: doc.uri,
                description: 'User Function',
                params: []
            };
            if (fnParts.groups.params) {
                const PARAM_SEARCH = /&?[\w$]+\s*[\w]*\$?\*?\d*/g;
                let paramMatch;
                while ((paramMatch = PARAM_SEARCH.exec(fnParts.groups.params)) !== null) {
                    fn.params?.push({
                        name: paramMatch[0]
                    });
                }
            }
            fnList.push(fn);
        }
    }
    return fnList;
}
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    let sig = br.generateFunctionSignature(item.data);
    if (item.kind === node_1.CompletionItemKind.Function) {
        item.labelDetails = {
            detail: sig,
            description: item.data.description
        };
        item.detail = item.data.name + br.generateFunctionSignature(item.data);
        item.documentation = item.data.documentation;
    }
    // for (let itemIndex = 0; itemIndex < br.stringFunctions.length; itemIndex++) {
    // 	const stringFunctionItem: br.InternalFunction = br.stringFunctions[itemIndex];
    // 	let sig = br.generateFunctionSignature(stringFunctionItem);
    // 	if (item.label == stringFunctionItem.name){
    // 		item.labelDetails = {
    // 			detail: sig,
    // 			description: stringFunctionItem.description
    // 		},
    // 		item.detail = stringFunctionItem.name + br.generateFunctionSignature(stringFunctionItem)
    // 		item.documentation = stringFunctionItem.documentation
    // 		break
    // 	}
    // }
    return item;
});
const CONTAINS_BALANCED_FN = /[a-zA-Z][\w]*\$?(\*\d+)?\([^()]*\)/g;
function stripBalancedFunctions(line) {
    if (CONTAINS_BALANCED_FN.test(line)) {
        line = line.replace(CONTAINS_BALANCED_FN, "");
        line = stripBalancedFunctions(line);
    }
    return line;
}
const STRING_LITERALS = /(}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g;
const FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i;
function getFunctionDetails(preText, doc) {
    // strip functions with params
    if (preText) {
        // remove literals first
        preText = preText.replace(STRING_LITERALS, "");
        preText = stripBalancedFunctions(preText);
        let context = FUNCTION_CALL_CONTEXT.exec(preText);
        if (context && context.groups && !context.groups.isDef) {
            let brFunctions = br.getFunctionsByName(context.groups.name) || getUserFunctionsByName(doc, context.groups.name);
            const sigHelp = {
                signatures: [],
                activeSignature: 0
            };
            for (let brFnIndex = 0; brFnIndex < brFunctions.length; brFnIndex++) {
                let brFunction = brFunctions[brFnIndex];
                let params = [];
                if (brFunction && brFunction.params) {
                    for (let paramIndex = 0; paramIndex < brFunction.params.length; paramIndex++) {
                        let el = brFunction.params[paramIndex];
                        params.push({
                            label: el.name,
                            documentation: el.documentation
                        });
                    }
                }
                sigHelp.signatures.push({
                    label: brFunction.name + br.generateFunctionSignature(brFunction),
                    parameters: [...params],
                    activeParameter: context.groups.params?.split(',').length - 1
                });
                return sigHelp;
            }
        }
        else {
            // not in function call with parameters
            return;
        }
    }
}
function getUserFunctionsByName(doc, name) {
    let docUserFunctions = getUserFunctionsFromDocument(doc);
    let matchingFunctions = [];
    for (let fnIndex = 0; fnIndex < docUserFunctions.length; fnIndex++) {
        const userFn = docUserFunctions[fnIndex];
        if (userFn.name === name) {
            matchingFunctions.push(userFn);
        }
    }
    return matchingFunctions;
}
connection.onSignatureHelp((params) => {
    let doc = documents.get(params.textDocument.uri);
    let sigHelp;
    if (doc) {
        let doctext = doc.getText({
            start: {
                line: 0,
                character: 0
            },
            end: params.position
        });
        // console.log(doctext);
        sigHelp = getFunctionDetails(doctext, doc);
        return sigHelp;
    }
    return sigHelp;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
var completionExample = {
    label: 'STR$',
    labelDetails: {
        detail: "(<number>)",
        description: "internal function"
    },
    detail: "STR$(<numeric expression>)",
    documentation: 'The Str$ internal function returns the string form of a numeric value X.',
    insertTextFormat: node_1.InsertTextFormat.Snippet,
    insertText: 'STR$',
    kind: node_1.CompletionItemKind.Method
};
function getFunctionCompletions() {
    let functionCompletions = [];
    br.stringFunctions.forEach(internalFunction => {
        let completion = {
            label: internalFunction.name,
            kind: node_1.CompletionItemKind.Function,
            data: internalFunction
        };
        functionCompletions.push(completion);
    });
    return functionCompletions;
}
//# sourceMappingURL=server.js.map