import { WorkspaceFolder } from "vscode-languageserver/node";
import { URI as Uri } from "vscode-uri";
import BrParser from './BrParser';
import Parser = require("tree-sitter");
import UserFunction from './UserFunction';

type FunctionKey = {
  isLibrary: boolean;
  name: string;
};

export default class SourceDocument {
  private _functions?: Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction>;
  buffer: ArrayBufferLike;
  parser: BrParser;
  tree: Parser.Tree | null = null;
  uri: Uri;
  workspaceFolder: WorkspaceFolder | undefined;
  linkPath: string;

  constructor(parser: BrParser, uri: Uri, buffer: ArrayBufferLike, workspaceFolder?: WorkspaceFolder) {
    this.parser = parser;
    this.uri = uri;
    this.buffer = buffer;
    this.workspaceFolder = workspaceFolder;
    this.linkPath = uri.fsPath.replace(/\\/g, "/").replace(/\.[^/.]+$/, "")
  }

	public get functions(): Map<{ isLibrary: boolean; name: string; }, UserFunction> {
    if (this._functions === undefined) {
      this._functions = this.getAllFunctions();
    }
    return this._functions;
	}

	getTree(): Parser.Tree {
    if (!this.tree) {
      this.tree = this.parser.getBufferTree(this.uri, this.buffer)!;
    }
    return this.tree;
	}

  /**
   * Get a function by name using tree-sitter queries
   */
  public getFunctionByName(name: string): UserFunction | undefined {
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
  private getAllFunctions(): Map<{
    isLibrary: boolean;
    name: string;
  }, UserFunction> {
    const tree = this.getTree();
    if (!tree) {
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

    const results = this.parser.match(query, tree.rootNode)
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