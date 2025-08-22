import { Uri, WorkspaceFolder, workspace } from "vscode";
import BrParser from '../parser';
import Parser = require("tree-sitter");
import UserFunction from './UserFunction';

type FunctionKey = {
  isLibrary: boolean;
  name: string;
};

export default class TreeSitterSourceDocument {
  functions: Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction> = new Map();
  buffer: Buffer;
  parser: BrParser;
  tree: Parser.Tree | null = null;
  uri: Uri;
  workspaceFolder: WorkspaceFolder | undefined;
  linkPath: string;

  constructor(parser: BrParser, uri: Uri, buffer: Uint8Array | Buffer, workspaceFolder?: WorkspaceFolder) {
    this.parser = parser;
    this.uri = uri;
    this.buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer); // Convert Uint8Array to Buffer if needed
    this.workspaceFolder = workspaceFolder;
    this.linkPath = workspace.asRelativePath(uri, false).replace("/","\\").replace(/\.[^\\/.]+$/,"")
    this.parse();
  }

  /**
   * Parse the buffer content and update the tree
   */
  public parse(): void {
    const tree = this.parser.getBufferTree(this.uri, this.buffer);
    this.tree = tree || null;
    if (this.tree) {
      this.functions = this.getAllFunctions();
    }
  }

  /**
   * Update the buffer with new content and reparse
   */
  public updateBuffer(buffer: Buffer): void {
    this.buffer = buffer;
    this.parse();
  }

  /**
   * Get a function by name using tree-sitter queries
   */
  public async getFunctionByName(name: string): Promise<UserFunction | undefined> {
    const lowerName = name.toLowerCase();
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
   * Get all functions in this document
   */
  public getAllFunctions(): Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction> {
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
    return Array.from(this.functions.values()).some(fn => fn.isLibrary);
  }
}