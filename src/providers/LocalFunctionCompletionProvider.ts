import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, MarkdownString, Position, ProviderResult, TextDocument } from "vscode";
import BrParser from "../parser";
import DocComment from "../class/DocComment";
import UserFunction from "../class/UserFunction";
import Parser = require("web-tree-sitter");
import { nodeRange } from "../util/common";
import UserFunctionParameter from "../class/UserFunctionParameter";
import { VariableType } from "../types/VariableType";

export default class LocalFunctionCompletionProvider implements CompletionItemProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  toFn(result: Parser.QueryMatch, docs?: DocComment): UserFunction {
    const def = result.captures[0].node
    const nameNode = result.captures[2].node
    const params = result.captures[3].node.namedChildren
    let isLibrary = false
    if (def.descendantsOfType("library_keyword")){
      isLibrary = true
    }
    const fn = new UserFunction(nameNode.text,isLibrary, nodeRange(nameNode))
    fn.documentation = docs?.text
    for (const param of params) {
      const p = new UserFunctionParameter
      const nameNode = param.descendantsOfType(['stringreference','numberreference','stringarray','numberarray'])[0]
      p.name = nameNode.text ?? ""
      if (param.type === "required_parameter"){
        p.isOptional = false
      } else {
        p.isOptional = true
      }
      if (param.firstChild?.firstChild?.text === "&"){
        p.isReference = true
      } else {
        p.isReference = false
      }
      p.documentation = docs?.params.get(nameNode.text)
      p.length = this.getLength(param)
      p.type = this.getType(nameNode)
      fn.params.push(p)
    }
    return fn
  }

  getType(param: Parser.SyntaxNode): VariableType {
    switch (param.type) {
      case 'stringreference':
        return VariableType.string
      case 'numberreference':
        return VariableType.number
      case 'stringarray':
        return VariableType.stringarray
      case 'numberarray':
        return VariableType.numberarray
      default:
        throw new Error("Uknown type")
    }    
  }

  getLength(param: Parser.SyntaxNode): number | undefined {
    const lengthNodes = param.descendantsOfType("int")
    if (lengthNodes.length) {
      const lengthNode = lengthNodes[0]
      return parseInt(lengthNode.text)
    } else {
      return undefined
    }
  }

  getFunctions(document: TextDocument): UserFunction[] {
    const fnList: UserFunction[] = []
    const tree = this.parser.getDocumentTree(document)
    const fnQuery = `(def_statement 
      [
      (numeric_function_definition (function_name) @name
        (parameter_list)? @params
        ) @type
        (string_function_definition (function_name) @name
        (parameter_list)? @params
        ) @type
      ]) @def
    (doc_comment) @doc_comment`

    const results = this.parser.match(fnQuery, tree.rootNode)
    let lastDoc: DocComment | undefined = undefined
    for (const result of results) {
      switch (result.pattern) {
        case 0: {
            const fn = this.toFn(result, lastDoc)
            fnList.push(fn)
            lastDoc = undefined
          }
          break;
        case 1: {
            const node = result.captures[0].node
            lastDoc = DocComment.parse(node.text)
          }
          break;
      }
    }

    return fnList
  }

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    const completionItems: CompletionItem[] = []
    const fnList = this.getFunctions(document)
    for (const fn of fnList) {
      completionItems.push({
        kind: CompletionItemKind.Function,
        label: {
          label: fn.name,
          detail: ' (local function)'
        },
        detail: `(local function) ${fn.name}${fn.generateSignature()}`,
        documentation: new MarkdownString(fn.getAllDocs())
      })
    }

    return completionItems
  }

  // resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
  //   throw new Error("Method not implemented.");
  // }
}