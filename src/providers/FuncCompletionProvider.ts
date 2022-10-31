import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode";
import ConfiguredProject from "../class/ConfiguredProject";
import BrSourceDocument from "../class/BrSourceDocument";
import BaseCompletionProvider from "./BaseCompletionProvider";

/**
 * Library statement linkage list completion provider
 */
 export default class FuncCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, ConfiguredProject>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const completionItems: CompletionItem[] = []

    const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
        for (const [uri, lib] of project.libraries) {
          if (uri !== doc.uri.toString()){
            for (const fn of lib.libraryList){
              if (fn.isLibrary){
                completionItems.push({
                  kind: CompletionItemKind.Function,
                  label: {
                    label: fn.name,
                    detail: ' (library function)',
                    description: path.basename(lib.uri.fsPath)
                  },
                  detail: `(library function) ${fn.name}${fn.generateSignature()}`,
                  documentation: new MarkdownString(fn.getAllDocs())
                })
              }
            }
          }
        }
      }
    }

    const source = new BrSourceDocument(doc.uri, doc.getText())
    for (const fn of source.libraryList) {
      completionItems.push({
        kind: CompletionItemKind.Function,
        label: {
          label: fn.name,
          detail: ` (${fn.isLibrary ? 'library' : 'local'} function)`
        },
        detail: `(${fn.isLibrary ? 'library' : 'local'} function) ${fn.name}${fn.generateSignature()}`,
        documentation: new MarkdownString(fn.getAllDocs())
      })
    }

    return completionItems
  }
}