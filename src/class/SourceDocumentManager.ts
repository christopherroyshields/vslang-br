import { Connection, DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidOpenTextDocumentParams, DocumentUri, TextDocumentChangeEvent, WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";
import BrParser from "./BrParser";
import SourceDocument from "./SourceDocument";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as glob from 'glob';
import { promisify } from "util";
import * as fs from 'fs';
import path = require("path");

const globPromise = promisify(glob);

/**
* Manages and caches parsed TreeSitter documents for the workspace.
* It listens to file events to keep the cache updated for open files
* and scans the workspace for all relevant source files.
*/
export class SourceDocumentManager {
  private connection: Connection;
  private parser: BrParser;
  private cachedDocuments: Map<DocumentUri, SourceDocument> = new Map();
  private workspaceFolders: WorkspaceFolder[] | null = null;
  
  constructor(connection: Connection, parser: BrParser) {
    this.connection = connection;
    this.parser = parser;
    
    // Bind to connection events for files opened in the editor
    this.connection.onDidOpenTextDocument(params => this.onDidOpen(params));
    this.connection.onDidChangeTextDocument(params => this.onDidChange(params));
    this.connection.onDidCloseTextDocument(params => this.onDidClose(params));
  }
  
  /**
  * Initializes the manager by scanning all workspace folders for source files.
  */
  public async initialize(folders: WorkspaceFolder[] | null): Promise<void> {
    this.connection.console.log('SourceDocumentManager initializing...');
    this.workspaceFolders = folders;
    if (!this.workspaceFolders) {
      return;
    }
    
    for (const folder of this.workspaceFolders) {
      const folderPath = URI.parse(folder.uri).fsPath;
      const filePaths = await globPromise('**/*.brs', { cwd: folderPath });
      
      this.connection.console.log(`Found ${filePaths.length} source files in ${folder.name}.`);
      
      for (const filePath of filePaths) {
        try {
          const fullPath = path.join(folderPath, filePath);
          const uri = URI.file(fullPath).toString();
          if (this.cachedDocuments.has(uri)) {
            continue; // Skip if already opened by the client
          }
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          const buffer = Buffer.from(content);
          const document = new SourceDocument(this.parser, URI.parse(uri), buffer, folder);
          this.cachedDocuments.set(uri, document);
        } catch (error) {
          this.connection.console.error(`Failed to read/parse ${filePath}: ${error}`);
        }
      }
    }
    this.connection.console.log(`Initialization complete. Total documents in cache: ${this.cachedDocuments.size}`);
  }
  
  /**
   * Scans a new workspace folder and adds its source files to the cache.
   * @param folder The workspace folder to add.
   */
  public async addWorkspaceFolder(folder: WorkspaceFolder): Promise<void> {
    this.connection.console.log(`Adding workspace folder: ${folder.name}`);
    this.workspaceFolders?.push(folder);

    const folderPath = URI.parse(folder.uri).fsPath;
    const filePaths = await globPromise('**/*.brs', { cwd: folderPath });

    this.connection.console.log(`Found ${filePaths.length} source files in new folder ${folder.name}.`);

    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(folderPath, filePath);
        const uri = URI.file(fullPath).toString();
        if (this.cachedDocuments.has(uri)) continue;
        
        const content = await fs.promises.readFile(fullPath, 'utf-8');
        const buffer = Buffer.from(content);
        const document = new SourceDocument(this.parser, URI.parse(uri), buffer, folder);
        this.cachedDocuments.set(uri, document);
      } catch (error) {
        this.connection.console.error(`Failed to read/parse ${filePath} in ${folder.name}: ${error}`);
      }
    }
  }

  /**
   * Removes a workspace folder and its associated documents from the cache.
   * @param folder The workspace folder to remove.
   */
  public removeWorkspaceFolder(folder: WorkspaceFolder): void {
    this.connection.console.log(`Removing workspace folder: ${folder.name}`);

    if (this.workspaceFolders) {
      this.workspaceFolders = this.workspaceFolders.filter(f => f.uri !== folder.uri);
    }
    
    for (const [uri] of this.cachedDocuments) {
      if (uri.startsWith(folder.uri)) {
        this.cachedDocuments.delete(uri);
        this.parser.trees.delete(uri); // Clean up parser's tree cache
        this.connection.console.log(`Removed ${uri} from cache.`);
      }
    }
  }
  
  private async onDidOpen(params: DidOpenTextDocumentParams): Promise<void> {
    const doc = params.textDocument;
    if (doc.languageId === 'br') {
      this.connection.console.log(`Document opened: ${doc.uri}`);
      const sourceDoc = new SourceDocument(this.parser, URI.parse(doc.uri), Buffer.from(doc.text));
      this.cachedDocuments.set(doc.uri, sourceDoc);
    }
  }
  
  private async onDidChange(params: DidChangeTextDocumentParams): Promise<void> {
    const docIdentifier = params.textDocument;
    const existingDoc = this.cachedDocuments.get(docIdentifier.uri);
    if (existingDoc) {
      this.connection.console.log(`Document changed: ${docIdentifier.uri}`);
      // Re-create the source document to get fresh parse data (e.g., function lists)
      const content = await this.getContent(docIdentifier.uri);
      if (content) {
        const sourceDoc = new SourceDocument(this.parser, URI.parse(docIdentifier.uri), Buffer.from(content));
        this.cachedDocuments.set(docIdentifier.uri, sourceDoc);
      }
    }
  }

  async getContent(locationString: string): Promise<ArrayBufferLike> {
    const location = URI.parse(locationString);
    if (location.scheme !== 'file') {
      throw new Error('Protocol not supported: ' + location.scheme);
    }
    return await fs.promises.readFile(location.fsPath);
  }

  private onDidClose(params: DidCloseTextDocumentParams): void {
    const docIdentifier = params.textDocument;
    // For files in the workspace, we keep them in the cache even when closed.
    // We only remove untitled files or files outside the workspace.
    const workspaceFolder = this.workspaceFolders?.find(folder => docIdentifier.uri.startsWith(folder.uri));
    if (!workspaceFolder) {
      this.connection.console.log(`Document closed and removed from cache: ${docIdentifier.uri}`);
      this.cachedDocuments.delete(docIdentifier.uri);
      this.parser.trees.delete(docIdentifier.uri); // Clean up parser's tree cache
    } else {
      this.connection.console.log(`Document closed, but kept in cache as it's part of the workspace: ${docIdentifier.uri}`);
    }
  }
  
  /**
  * Retrieves a parsed source document from the cache.
  * @param uri The URI of the document to retrieve.
  */
  public async get(uri: string): Promise<SourceDocument> {
    if (this.cachedDocuments.has(uri)) {
      return this.cachedDocuments.get(uri)!;
    } else {
      const content = await this.getContent(uri);
      const document = new SourceDocument(this.parser, URI.parse(uri), Buffer.from(content));
      this.cachedDocuments.set(uri, document);
      return document;
    }
  }
  
  /**
  * Returns all documents currently in the cache.
  */
  public all(folder?: WorkspaceFolder): SourceDocument[] {
    if (folder) {
      return Array.from(this.cachedDocuments.values()).filter(doc => doc.workspaceFolder?.uri === folder.uri);
    } else {
      return Array.from(this.cachedDocuments.values());
    }
  }
} 