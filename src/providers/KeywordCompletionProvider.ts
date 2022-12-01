import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode"
import { Keywords } from "../completions/keywords"
import BaseCompletionProvider from "./BaseCompletionProvider"
import ProjectSourceDocument from "../class/ProjectSourceDocument"
import { Project } from "../class/Project"

/**
 * Library statement linkage list completion provider
 */
export default class KeywordCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const word = doc.getText(doc.getWordRangeAtPosition(position))
    const isLower = !/[A-Z]/.test(word)
    
    return Keywords.map((s)=>{
      const md = new MarkdownString()
      const item: CompletionItem = {
        label: {
          label: isLower ? s.name.toLocaleLowerCase() : s.name,
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