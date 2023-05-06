import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, MarkdownString, Position, ProviderResult, TextDocument } from "vscode";
import BrParser from "../parser";

export default class LocalFunctionCompletionProvider implements CompletionItemProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    const completionItems: CompletionItem[] = []
    const fnList = this.parser.getLocalFunctionList(document)
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
}