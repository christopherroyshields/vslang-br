import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode"
import ConfiguredProject from "../class/ConfiguredProject"
import BrSourceDocument from "../class/BrSourceDocument"
import { Statements } from "../completions/statements"
import BaseCompletionProvider from "./BaseCompletionProvider"
import ProjectSourceDocument from "../class/ProjectSourceDocument"
import { Project } from "./Project"

/**
 * Library statement linkage list completion provider
 */
export default class StatementCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const word = doc.getText(doc.getWordRangeAtPosition(position))
    const isLower = !/[A-Z]/.test(word)
    
    return Statements.map((s)=>{
      const md = new MarkdownString()
      const item: CompletionItem = {
        label: {
          label: isLower ? s.name.toLocaleLowerCase() : s.name,
          description: 'statement'
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