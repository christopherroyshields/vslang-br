import { DocumentSymbol, Range, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode";
import { VariableType } from "../types/VariableType";
import DocComment from "./DocComment";
import { LineLabel } from "./LineLabel";
import BrParser from '../parser';
import Parser = require("tree-sitter");
import { getSearchPath } from "../util/common";
import path = require("path");

type DimVariable = {
  name: string;
  type: VariableType;
  position: {
    start: number;
    end: number;
  };
};

type FunctionKey = {
  isLibrary: boolean;
  name: string;
};

export default class TreeSitterSourceDocument {
  functions: FunctionKey[] = [];
  labels: LineLabel[] = [];
  dims: DimVariable[] = [];
  lastDocComment: DocComment | null = null;

  private static LABEL_QUERY = `
    (label) @label
  `;
  private static FUNCTION_QUERY = `
    (function_definition
      name: (identifier) @name
      library: (identifier)? @library) @function
  `;
  private static DIM_QUERY = `
    (dim_statement
      (variable_declaration
        name: (identifier) @name
        array: (array_declaration)? @array)) @dim
  `;
  private static DOC_COMMENT_QUERY = `
    (doc_comment) @doc
  `;

  parser: BrParser;
  tree: Parser.Tree;
  uri: Uri;
  workspaceFolder: WorkspaceFolder | undefined;
  linkPath: string;

  constructor(parser: BrParser, uri: Uri, tree: Parser.Tree, workspaceFolder?: WorkspaceFolder) {
    this.tree = tree;
    this.parser = parser;
    this.uri = uri;
    this.workspaceFolder = workspaceFolder;
    this.linkPath = workspace.asRelativePath(uri, false).replace("/","\\").replace(/\.[^\\/.]+$/,"")
  }

  private getLinkPath(workspaceFolder: WorkspaceFolder): string {
    const searchPath = getSearchPath(workspaceFolder)
    const parsedPath = path.parse(this.uri.fsPath.substring(searchPath.fsPath.length + 1))
    const libPath = path.join(parsedPath.dir, parsedPath.name)
    return libPath
  }

  public parse(buffer: Buffer): void {
    const tree = this.parser.getBufferTree(this.uri, buffer);
    if (tree) {
      this.tree = tree;
    }
  }

  getSymbols(tree: Parser.Tree): void {
    const query = `(def_statement) @def
    (dim_statement
      (_
        name: (_) @dim)*)
    (label) @label
    (doc_comment) @doc`

    const results = this.parser.match(query, tree.rootNode)
    
    const symbolInfoList: DocumentSymbol[] = []
    for (const result of results) {
      const node = result.captures[0].node
      switch (node.type) {
        case 'label': {
          if (node) {
            this.labels.push({
              name: node.text,
              offset: {
                start: node.startIndex,
                end: node.endIndex,
              },
            });
          }
          }
          break;
        case 'def_statement': {
            const name = node.descendantsOfType("function_name")
            if (name.length){
              const node = name[0]
              if (node){
                // const fnRange = new Range(document.positionAt(node.startIndex),document.positionAt(node.endIndex))
                // const symbolInfo = new DocumentSymbol(node.text, "function", SymbolKind.Function, fnRange, fnRange)
                // symbolInfoList.push(symbolInfo)
              }
            }
          }
          break;
        default:
          break;
      }
    }
  }
  
  private processLabels(tree: Parser.Tree): void {
    const matches = this.parser.match(TreeSitterSourceDocument.LABEL_QUERY, tree.rootNode);
    matches.forEach((match) => {
      const labelNode = match.captures.find((capture) => capture.name === "label")?.node;
      if (labelNode) {
        this.labels.push({
          name: labelNode.text,
          offset: {
            start: labelNode.startIndex,
            end: labelNode.endIndex,
          },
        });
      }
    });
  }

  private processFunctions(tree: Parser.Tree): void {
    const matches = this.parser.match(TreeSitterSourceDocument.FUNCTION_QUERY, tree.rootNode);
    matches.forEach((match) => {
      const nameNode = match.captures.find((capture) => capture.name === "name")?.node;
      const libraryNode = match.captures.find((capture) => capture.name === "library")?.node;
      if (nameNode) {
        this.functions.push({
          isLibrary: !!libraryNode,
          name: nameNode.text,
        });
      }
    });
  }

  private processDims(tree: Parser.Tree): void {
    const matches = this.parser.match(TreeSitterSourceDocument.DIM_QUERY, tree.rootNode);
    matches.forEach((match) => {
      const nameNode = match.captures.find((capture) => capture.name === "name")?.node;
      const arrayNode = match.captures.find((capture) => capture.name === "array")?.node;
      if (nameNode) {
        const isString = nameNode.text.endsWith("$");
        const isArray = !!arrayNode;
        const varType = isArray
          ? isString
            ? VariableType.stringarray
            : VariableType.numberarray
          : isString
          ? VariableType.string
          : VariableType.number;

        this.dims.push({
          name: nameNode.text,
          type: varType,
          position: {
            start: nameNode.startIndex,
            end: nameNode.endIndex,
          },
        });
      }
    });
  }

  private processDocComments(tree: Parser.Tree): void {
    const matches = this.parser.match(TreeSitterSourceDocument.DOC_COMMENT_QUERY, tree.rootNode);
    matches.forEach((match) => {
      const docNode = match.captures.find((capture) => capture.name === "doc")?.node;
      if (docNode) {
        this.lastDocComment = DocComment.parse(docNode.text);
      }
    });
  }
}