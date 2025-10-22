import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode"
import { Keywords } from "../completions/keywords"

/**
 * Library statement linkage list completion provider
 */
export default class KeywordCompletionProvider {
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const word = doc.getText(doc.getWordRangeAtPosition(position))
    const isLower = !/[A-Z]/.test(word)
    const isUpper = !/[a-z]/.test(word)
    
    return Keywords.map((s)=>{
      const md = new MarkdownString()
      let label = s.name
      if (isLower){
        label=label.toLowerCase()
      } else if (isUpper){
        label=label.toUpperCase()
      }
      const item: CompletionItem = {
        label: {
          label: label,
          description: 'keyword'
        },
        detail: s.description,
        kind: CompletionItemKind.Keyword
      }
      if (s.documentation) md.appendMarkdown(s.documentation)
      if (s.docUrl) md.appendMarkdown(` [docs...](${s.docUrl})`)
      if (s.example) md.appendCodeblock(s.example) 
      if (md.value.length>0){
        item.documentation = md
      }
      return item
    })
  }
}