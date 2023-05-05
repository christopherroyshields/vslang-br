import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionList, MarkdownString, Position, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import BrSourceDocument from "../class/BrSourceDocument"
import BaseCompletionProvider from "./BaseCompletionProvider"
import { TypeLabel } from "../util/common"
import { Project } from "../class/Project"
import { InternalFunctions } from "../completions/functions";

/**
 * Library statement linkage list completion provider
 */
export default class FuncCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const completionItems: CompletionItem[] = []

    const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
        for (const [uri, lib] of project.sourceFiles) {
          if (uri !== doc.uri.toString()){
            for (const fn of lib.functions){
              if (fn.isLibrary){
                completionItems.push({
                  kind: CompletionItemKind.Function,
                  label: {
                    label: fn.name,
                    detail: ' (library function)',
                    description: path.basename(lib.uri.fsPath)
                  }
                })
              }
            }
          }
        }

        for (const [uri, layout] of project.layouts){
          for (const subscript of layout.subscripts) {
            const fileName = path.parse(Uri.parse(uri).fsPath).base
            completionItems.push({
              kind: CompletionItemKind.Variable,
              label: {
                label: layout.prefix + subscript.name.replace("$",""),
                detail: ' (subscript)',
                description: fileName
              },
              detail: `(subscript) ${subscript.name} ${subscript.format}`,
              documentation: subscript.description
            })
          }
        }
      }
    }

    return completionItems
  }
}