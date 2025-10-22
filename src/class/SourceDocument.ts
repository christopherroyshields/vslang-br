import { Uri, WorkspaceFolder, workspace } from "vscode";
import BrParser from '../parser';
import Parser = require("../../vendor/tree-sitter");
import UserFunction from './UserFunction';
import { LibraryFunctionMetadata } from './LibraryFunctionIndex';
import { scanLibraryFunctions } from '../util/libraryScanner';

type FunctionKey = {
  isLibrary: boolean;
  name: string;
};

export default class SourceDocument {
  functions: Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction> = new Map();
  libraryFunctions: LibraryFunctionMetadata[] = [];
  buffer: Buffer;
  parser: BrParser;
  private tree: Parser.Tree | null = null;
  private isTreeParsed = false;
  uri: Uri;
  workspaceFolder: WorkspaceFolder | undefined;
  linkPath: string;

  constructor(parser: BrParser, uri: Uri, buffer: Uint8Array | Buffer, workspaceFolder?: WorkspaceFolder) {
    this.parser = parser;
    this.uri = uri;
    this.buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer); // Convert Uint8Array to Buffer if needed
    this.workspaceFolder = workspaceFolder;
    this.linkPath = workspace.asRelativePath(uri, false).replace("/","\\").replace(/\.[^\\/.]+$/,"")
    // Don't parse immediately - just scan for library functions
    this.scanLibraryFunctions();
  }

  /**
   * Scan for library functions using regex (fast)
   */
  public scanLibraryFunctions(): void {
    this.libraryFunctions = scanLibraryFunctions(this.buffer, this.uri);
  }

  /**
   * Ensure the tree is parsed (lazy loading)
   */
  private ensureTreeParsed(): void {
    if (!this.isTreeParsed) {
      const tree = this.parser.getBufferTree(this.uri, this.buffer);
      this.tree = tree || null;
      this.isTreeParsed = true;
      if (this.tree) {
        this.functions = this.getAllFunctions();
      }
    }
  }

  /**
   * Parse the buffer content and update the tree (for compatibility)
   */
  public parse(): void {
    this.ensureTreeParsed();
  }

  /**
   * Update the buffer with new content and reparse
   */
  public updateBuffer(buffer: Buffer): void {
    this.buffer = buffer;
    this.isTreeParsed = false;
    this.tree = null;
    this.functions.clear();
    this.scanLibraryFunctions();
  }

  /**
   * Get a function by name using tree-sitter queries
   */
  public async getFunctionByName(name: string): Promise<UserFunction | undefined> {
    const lowerName = name.toLowerCase();
    
    // Check if it's a library function first (no parsing needed)
    const libFunc = this.libraryFunctions.find(f => f.name.toLowerCase() === lowerName);
    if (libFunc) {
      // Need to parse to get full UserFunction object
      this.ensureTreeParsed();
    } else {
      // For non-library functions, we need to parse
      this.ensureTreeParsed();
    }
    
    let fn: UserFunction | undefined;
    for (const [key, value] of this.functions) {
      if (key.name.toLowerCase() === lowerName) {
        fn = value;
        break;
      }
    }
    return fn;
  }

  /**
   * Get the parse tree (triggers parsing if needed)
   */
  public getTree(): Parser.Tree | null {
    this.ensureTreeParsed();
    return this.tree;
  }

  /**
   * Check if the tree has been parsed
   */
  public isParsed(): boolean {
    return this.isTreeParsed;
  }

  /**
   * Get all functions in this document
   */
  public getAllFunctions(): Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction> {
    this.ensureTreeParsed();
    if (!this.tree) {
      return new Map();
    }

    const fnList: Map<{
      isLibrary: boolean;
      name: string;
    }, UserFunction> = new Map();

    const query = `(
      (line (doc_comment) @doc_comment)?
      .
      (line
      (def_statement 
        [
        (numeric_function_definition (function_name) @name
          (parameter_list)? @params
          ) @type
          (string_function_definition (function_name) @name
          (parameter_list)? @params
          ) @type
        ]) @def)
      )`

    const results = this.parser.match(query, this.tree.rootNode)
    for (const result of results) {
      const fn = this.parser.toFn(result)
      if (fn) {
        fnList.set({
          isLibrary: fn.isLibrary,
          name: fn.name,
        }, fn);
      }
    }
    return fnList
  }

  /**
   * Get the source content as string
   */
  public getContent(): string {
    return this.buffer.toString();
  }

  /**
   * Check if this document contains library functions
   */
  public hasLibraryFunctions(): boolean {
    // Use the fast scan result instead of parsing
    return this.libraryFunctions.length > 0;
  }

  /**
   * Get library functions without parsing (fast)
   */
  public getLibraryFunctionsMetadata(): LibraryFunctionMetadata[] {
    return this.libraryFunctions;
  }
}