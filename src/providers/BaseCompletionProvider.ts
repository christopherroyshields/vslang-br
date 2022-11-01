import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, WorkspaceFolder } from "vscode"
import ConfiguredProject from "../class/ConfiguredProject"
import ProjectSourceDocument from "../class/ProjectSourceDocument"

export default class BaseCompletionProvider implements CompletionItemProvider {
  configuredProjects: Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>
  constructor(configuredProjects: Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>) {
    this.configuredProjects = configuredProjects
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList<CompletionItem> | CompletionItem[]> {
    throw new Error("Method not implemented.")
  }
  resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
    throw new Error("Method not implemented.")
  }
}
