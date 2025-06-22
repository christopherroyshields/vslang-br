import { Connection, Diagnostic, DiagnosticSeverity, DidChangeConfigurationNotification, HandlerResult, InitializeParams, InitializeResult, TextDocuments, TextDocumentSyncKind, WorkspaceFolder } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import UserFunction from "./UserFunction";
import HoverHandler from "./HoverHandler";
import { SourceDocumentManager } from "./SourceDocumentManager";
import BrParser from "./BrParser";

// The example settings
interface UserServerSettings {
    maxNumberOfProblems: 100
}

export class BrLanguageServer {
    private connection: Connection;
    private parser: BrParser;
    private sourceDocuments: SourceDocumentManager;
    private hoverHandler: HoverHandler;
    private workspaceFolders: WorkspaceFolder[] | null = null;
    private hasConfigurationCapability = false;
    private hasWorkspaceFolderCapability = false;
    private hasDiagnosticRelatedInformationCapability = false;
    private globalSettings: UserServerSettings;
    private documentSettings: Map<string, Thenable<UserServerSettings>>;
    private userFunctions: UserFunction[];
    
    constructor(connection: Connection) {
        this.connection = connection;
        this.connection.console.log('Constructing BrLanguageServer');
        this.parser = new BrParser();
        this.sourceDocuments = new SourceDocumentManager(this.connection, this.parser);
        this.hoverHandler = new HoverHandler(this.parser, this.sourceDocuments);
        
        this.documentSettings = new Map();
        this.userFunctions = [];
        this.globalSettings = {
            maxNumberOfProblems: 100
        };
        
        this.connection.onInitialize((params: InitializeParams) => {
            this.connection.console.log('Server onInitialize event');
            this.workspaceFolders = params.workspaceFolders ?? null; // store folders
            return this.onInitializeRequest(params);
        });
        
        this.connection.onInitialized(() => {
            this.onInitialized();
        });
        
        this.connection.onHover(async (params) => {
            const document = this.sourceDocuments.get(params.textDocument.uri);
            return this.hoverHandler.provideHover(params.textDocument.uri, params.position);
        });
        
        // this.documents.listen(this.connection);
        this.connection.listen();
        this.connection.console.log('BrLanguageServer constructed and listening');
    }
    
    public onInitializeRequest(params: InitializeParams): InitializeResult {
        const capabilities = params.capabilities;
        
        this.hasConfigurationCapability = !!(
            capabilities.workspace && !!capabilities.workspace.configuration
        );
        this.hasWorkspaceFolderCapability = !!(
            capabilities.workspace && !!capabilities.workspace.workspaceFolders
        );
        this.hasDiagnosticRelatedInformationCapability = !!(
            capabilities.textDocument &&
            capabilities.textDocument.publishDiagnostics &&
            capabilities.textDocument.publishDiagnostics.relatedInformation
        );
        
        this.connection.console.log(`Client capabilities: ${JSON.stringify(capabilities)}`);
        
        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true
            }
        };
        
        if (this.hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true
                }
            };
        }
        return result;
    }
    
    public onInitialized(): void {
        if (this.hasConfigurationCapability) {
            this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
        }
        if (this.hasWorkspaceFolderCapability) {
            this.connection.workspace.onDidChangeWorkspaceFolders(event => {
                this.connection.console.log('Workspace folder change event received.');
                for (const added of event.added) {
                    this.sourceDocuments.addWorkspaceFolder(added);
                }
                for (const removed of event.removed) {
                    this.sourceDocuments.removeWorkspaceFolder(removed);
                }
            });
        }
        this.connection.console.log('Server onInitialized event');
        this.sourceDocuments.initialize(this.workspaceFolders);
    }
    
    public onDidChangeConfiguration(change: any): void {
        if (this.hasConfigurationCapability) {
            this.documentSettings.clear();
        } else {
            this.globalSettings = <UserServerSettings>(
                (change.settings.languageServer || this.globalSettings)
            );
        }
    }
    
    private getDocumentSettings(resource: string): Thenable<UserServerSettings> {
        if (!this.hasConfigurationCapability) {
            return Promise.resolve(this.globalSettings);
        }
        let result = this.documentSettings.get(resource);
        if (!result) {
            result = this.connection.workspace.getConfiguration({
                scopeUri: resource,
                section: 'languageServer'
            });
            this.documentSettings.set(resource, result);
        }
        return result;
    }
    
    public onDidClose(e: { document: TextDocument }): void {
        this.documentSettings.delete(e.document.uri);
    }
    
    public onDidChangeContent(change: { document: TextDocument }): void {
        // Handle document content changes
    }
    
    public onDidChangeWatchedFiles(_change: any): void {
        // Monitored files have change in VSCode
        this.connection.console.log('We received an file change event');
    }
}

