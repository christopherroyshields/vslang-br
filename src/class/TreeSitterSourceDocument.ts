import { Uri, WorkspaceFolder, workspace } from "vscode";
import BrParser from '../parser';
import Parser = require("tree-sitter");
import UserFunction from './UserFunction';

type FunctionKey = {
  isLibrary: boolean;
  name: string;
};

export default class TreeSitterSourceDocument {
  functions: FunctionKey[] = [];
  buffer: ArrayBufferLike;
  parser: BrParser;
  tree: Parser.Tree | null = null;
  uri: Uri;
  workspaceFolder: WorkspaceFolder | undefined;
  linkPath: string;

  constructor(parser: BrParser, uri: Uri, buffer: ArrayBufferLike, workspaceFolder?: WorkspaceFolder) {
    this.parser = parser;
    this.uri = uri;
    this.buffer = Buffer.from(buffer); // Convert ArrayBufferLike to Buffer
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
      this.indexFunctions();
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
    if (!this.tree) {
      return undefined;
    }

    const name_match = name.replace(/[a-zA-Z]/g, c => {
      return `[${c.toUpperCase()}${c.toLowerCase()}]`
    }).replace("$","\\\\$")

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
        (#match? @name "^${name_match}$")
      )`

    const results = this.parser.match(query, this.tree.rootNode)
    if (results.length) {
      const fn = this.parser.toFn(results[0])
      return fn
    }
    return undefined;
  }

  /**
   * Get all functions in this document
   */
  public getAllFunctions(): UserFunction[] {
    if (!this.tree) {
      return [];
    }

    const fnList: UserFunction[] = []
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
        fnList.push(fn)
      }
    }
    return fnList
  }

  /**
   * Index functions for quick lookup
   */
  private indexFunctions(): void {
    this.functions = [];
    if (!this.tree) {
      return;
    }

    const query = `(def_statement 
      [
        (numeric_function_definition (function_name) @name) @fn
        (string_function_definition (function_name) @name) @fn
      ])`

    const results = this.parser.match(query, this.tree.rootNode);
    for (const result of results) {
      const nameNode = result.captures.find(c => c.name === "name")?.node;
      const fnNode = result.captures.find(c => c.name === "fn")?.node;
      
      if (nameNode && fnNode) {
        const isLibrary = fnNode.descendantsOfType("library_keyword").length > 0;
        this.functions.push({
          isLibrary,
          name: nameNode.text,
        });
      }
    }
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
    return this.functions.some(fn => fn.isLibrary);
  }
}