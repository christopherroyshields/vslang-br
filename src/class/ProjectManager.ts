import { Uri, WorkspaceFolder, workspace } from 'vscode';
import Layout from './Layout';
import TreeSitterSourceDocument from './TreeSitterSourceDocument';
import LightweightSourceDocument from './LightweightSourceDocument';
import { LRUCache } from '../util/LRUCache';
import BrParser from '../parser';

/**
 * Manages project files with lazy loading and caching
 */
export class ProjectManager {
  // Lightweight docs for quick access (all files)
  public lightweightDocs: Map<string, LightweightSourceDocument> = new Map();
  
  // Fully parsed documents cache (limited size)
  private parsedCache: LRUCache<string, TreeSitterSourceDocument>;
  
  // Layouts
  public layouts: Map<string, Layout> = new Map();
  
  // Parser instance
  private parser: BrParser;
  
  // Workspace folder
  private workspaceFolder?: WorkspaceFolder;

  constructor(parser: BrParser, workspaceFolder?: WorkspaceFolder, cacheSize = 50) {
    this.parser = parser;
    this.workspaceFolder = workspaceFolder;
    this.parsedCache = new LRUCache(cacheSize);
  }

  /**
   * Add a lightweight document (fast, startup)
   */
  public addLightweightDoc(uri: Uri, content: string | Buffer): void {
    const lightDoc = new LightweightSourceDocument(uri, content, this.workspaceFolder);
    this.lightweightDocs.set(uri.toString(), lightDoc);
  }

  /**
   * Get or create a fully parsed document (on-demand)
   */
  public async ensureFullyParsed(uri: Uri): Promise<TreeSitterSourceDocument | undefined> {
    const uriString = uri.toString();
    
    // Check cache first
    let fullDoc = this.parsedCache.get(uriString);
    if (fullDoc) {
      return fullDoc;
    }

    // Get the lightweight doc
    const lightDoc = this.lightweightDocs.get(uriString);
    if (!lightDoc) {
      // Not in our project, try to read it
      try {
        const buffer = await workspace.fs.readFile(uri);
        fullDoc = new TreeSitterSourceDocument(this.parser, uri, buffer, this.workspaceFolder);
        this.parsedCache.set(uriString, fullDoc);
        return fullDoc;
      } catch {
        return undefined;
      }
    }

    // Parse the document
    const content = lightDoc.getContent();
    if (!content) {
      // Content was cleared, need to re-read
      try {
        const buffer = await workspace.fs.readFile(uri);
        fullDoc = new TreeSitterSourceDocument(this.parser, uri, buffer, this.workspaceFolder);
      } catch {
        return undefined;
      }
    } else {
      fullDoc = new TreeSitterSourceDocument(this.parser, uri, Buffer.from(content), this.workspaceFolder);
      // Clear content from lightweight doc to save memory
      lightDoc.clearContent();
    }

    // Cache the parsed document
    this.parsedCache.set(uriString, fullDoc);
    return fullDoc;
  }

  /**
   * Find which file contains a function
   */
  public findFunctionFile(functionName: string): Uri | undefined {
    for (const [uriString, lightDoc] of this.lightweightDocs) {
      if (lightDoc.hasFunction(functionName)) {
        return Uri.parse(uriString);
      }
    }
    return undefined;
  }

  /**
   * Get all function names across the project (fast)
   */
  public getAllFunctionNames(): string[] {
    const allFunctions = new Set<string>();
    for (const lightDoc of this.lightweightDocs.values()) {
      for (const funcName of lightDoc.getAllFunctionNames()) {
        allFunctions.add(funcName);
      }
    }
    return Array.from(allFunctions);
  }

  /**
   * Check if a document is already fully parsed
   */
  public isFullyParsed(uri: Uri): boolean {
    return this.parsedCache.has(uri.toString());
  }

  /**
   * Evict a document from the cache
   */
  public evictFromCache(uri: Uri): void {
    this.parsedCache.delete(uri.toString());
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    this.parsedCache.clear();
    // Re-read content for lightweight docs if needed
    for (const lightDoc of this.lightweightDocs.values()) {
      lightDoc.clearContent();
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      lightweightDocs: this.lightweightDocs.size,
      parsedCache: this.parsedCache.getStats()
    };
  }

  /**
   * Update a document when it changes
   */
  public async updateDocument(uri: Uri, content?: Buffer | Uint8Array): Promise<void> {
    const uriString = uri.toString();
    
    // Update lightweight doc
    if (!content) {
      const fileContent = await workspace.fs.readFile(uri);
      content = Buffer.from(fileContent);
    } else if (!(content instanceof Buffer)) {
      content = Buffer.from(content);
    }
    const lightDoc = new LightweightSourceDocument(uri, content, this.workspaceFolder);
    this.lightweightDocs.set(uriString, lightDoc);
    
    // If it's in the cache, update it too
    if (this.parsedCache.has(uriString)) {
      const fullDoc = new TreeSitterSourceDocument(this.parser, uri, content, this.workspaceFolder);
      this.parsedCache.set(uriString, fullDoc);
    }
  }

  /**
   * Remove a document
   */
  public removeDocument(uri: Uri): void {
    const uriString = uri.toString();
    this.lightweightDocs.delete(uriString);
    this.parsedCache.delete(uriString);
  }

  /**
   * Get the old-style sourceFiles map for compatibility
   */
  public get sourceFiles(): Map<string, TreeSitterSourceDocument> {
    // This provides backwards compatibility but only returns cached files
    const map = new Map<string, TreeSitterSourceDocument>();
    for (const [uri, _] of this.lightweightDocs) {
      const cached = this.parsedCache.get(uri);
      if (cached) {
        map.set(uri, cached);
      }
    }
    return map;
  }
}