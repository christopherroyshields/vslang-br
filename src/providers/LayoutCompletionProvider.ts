import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, Uri, WorkspaceFolder, workspace } from "vscode";
import { Project } from "../class/Project";
import path = require("path");

export default class LayoutCompletionProvider implements CompletionItemProvider {
  configuredProjects: Map<WorkspaceFolder, Project>
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    this.configuredProjects = configuredProjects
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    const completionItems: CompletionItem[] = []
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)
    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
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