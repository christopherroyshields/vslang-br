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
	ParameterInformation,
	HoverParams,
	Hover,
	Position,
	MarkupContent,
	MarkupKind,
	Connection,
	WorkspaceFolder
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import * as br from './completions/functions';
import * as vscode from 'vscode';
import UserFunction from './class/UserFunction';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection: Connection = createConnection(ProposedFeatures.all);

startServer(connection)

export function startServer(connection: Connection) {

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
				textDocumentSync: TextDocumentSyncKind.Incremental
			}
		};

		if (hasWorkspaceFolderCapability) {
			result.capabilities.workspace = {
				workspaceFolders: {
					supported: true
				}
			};

			const workspaceFolders: Map<string, WorkspaceFolder> = new Map();
			if (params.workspaceFolders) {
				for (const workspaceFolder of params.workspaceFolders) {
					workspaceFolders.set(workspaceFolder.uri, workspaceFolder);
				}
			}

			connection.workspace.onDidChangeWorkspaceFolders(event => {
				connection.console.log('Workspace folders changed');
				for (const workspaceFolder of event.added) {
					connection.console.log(`Adding workspace folder: ${workspaceFolder.uri}`);
					workspaceFolders.set(workspaceFolder.uri, workspaceFolder);
				}
				for (const workspaceFolder of event.removed) {
					connection.console.log(`Removing workspace folder: ${workspaceFolder.uri}`);
					workspaceFolders.delete(workspaceFolder.uri);
				}
			});
		}

		return result;
	});

	connection.onInitialized(() => {
		connection.console.log('Server initialized');
		if (hasConfigurationCapability) {
			// Register for all configuration changes.
			connection.client.register(DidChangeConfigurationNotification.type);
		}
		if (hasWorkspaceFolderCapability) {
			connection.workspace.onDidChangeWorkspaceFolders(event => {
				connection.console.log('Workspace folder change event received.');
			});
		}
	});

	/**
	 * Sets up monitoring of project configuration
	 */
	// async function activateWorkspaceFolders(context: ExtensionContext, configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser): Promise<Map<WorkspaceFolder, Project>> {
	// 	const disposablesMap = new Map<WorkspaceFolder,Disposable[]>()
	// 	if (workspace.workspaceFolders){
	// 		for (const workspaceFolder of workspace.workspaceFolders) {
	// 			const disposables: Disposable[] = []
	// 			const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
	// 			configuredProjects.set(workspaceFolder, project)
	// 			disposablesMap.set(workspaceFolder, disposables)

	// 			workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
	// 				if (e.affectsConfiguration("br", workspaceFolder)){
	// 					disposablesMap.get(workspaceFolder)?.forEach(d => d.dispose())	
	// 					const disposables: Disposable[] = []
	// 					const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
	// 					configuredProjects.set(workspaceFolder, project)
	// 					disposablesMap.set(workspaceFolder, disposables)
	// 				}
	// 			})
	// 		}
	// 	}

	// 	workspace.onDidChangeWorkspaceFolders(async ({ added, removed }: WorkspaceFoldersChangeEvent) => {
	// 		if (added) {
	// 			for (const workspaceFolder of added) {
	// 				const disposables: Disposable[] = []
	// 				const project = await startWatchingFiles(workspaceFolder, disposables, parser, context)
	// 				configuredProjects.set(workspaceFolder, project)
	// 				disposablesMap.set(workspaceFolder, disposables)
	// 			}
	// 		}
	// 		if (removed){
	// 			for (const workspaceFolder of removed) {
	// 				disposablesMap.get(workspaceFolder)?.forEach(d => d.dispose())
	// 			}
	// 		}
	// 	})

	// 	return configuredProjects
	// }

	// The example settings

	interface UserServerSettings {
		maxNumberOfProblems: 100
	}

	// The global settings, used when the `workspace/configuration` request is not supported by the client.
	// Please note that this is not the case when using this server with the client provided in this example
	// but could happen with other clients.
	const defaultSettings: UserServerSettings = { 
		maxNumberOfProblems: 100,
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

	const userFunctions: UserFunction[] = []

	// The content of a text document has changed. This event is emitted
	// when the text document first opened or when its content has changed.
	documents.onDidChangeContent(change => {
		// console.log('Document change event:', {
		// 	uri: change.document.uri,
		// 	version: change.document.version,
		// 	content: change.document.getText()
		// });
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

	// Make the text document manager listen on the connection
	// for open, change and close text document events
	documents.listen(connection);

	// Listen on the connection
	connection.listen();

}