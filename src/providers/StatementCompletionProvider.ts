import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode";
import ConfiguredProject from "../class/ConfiguredProject";
import BrSourceDocument from "../class/BrSourceDocument";
import { Statements } from "../statements";
import BaseCompletionProvider from "./BaseCompletionProvider";
import ProjectSourceDocument from "../class/ProjectSourceDocument";
import { Project } from "./Project";

/**
 * Library statement linkage list completion provider
 */
export default class StatementCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    let word = doc.getText(doc.getWordRangeAtPosition(position))
    let isLower = !/[A-Z]/.test(word)
    
    return Statements.map((s)=>{
      let md = new MarkdownString()
      let item: CompletionItem = {
        label: {
          label: isLower ? s.name.toLocaleLowerCase() : s.name,
          description: 'statement'
        },
        detail: s.description,
        documentation: md,
        kind: CompletionItemKind.Keyword
      }
      if (s.documentation) md.appendMarkdown(s.documentation)
      if (s.docUrl) md.appendMarkdown(` [docs...](${s.docUrl})`)
      if (s.example) md.appendCodeblock(s.example) 
      return item
    })
  }
}