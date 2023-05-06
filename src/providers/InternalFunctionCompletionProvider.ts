import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionList, MarkdownString, Position, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { InternalFunctions } from "../completions/functions";

/**
 * Completions for hard coded internal funciton completions
 */
export default class InternalFunctionCompletionProvider {
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    
    for (const fn of InternalFunctions) {
      completionItems.push({
        kind: CompletionItemKind.Function,
        label: {
          label: fn.name,
          detail: `(internal function)`
        },
        detail: `(internal function) ${fn.generateSignature()}`,
        documentation: new MarkdownString(fn.getAllDocs())
      })
    }
    
    return completionItems
  }
}