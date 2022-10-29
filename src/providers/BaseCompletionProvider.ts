import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, WorkspaceFolder } from "vscode"
import { ConfiguredProject } from "../class/ConfiguredProject"

export class BaseCompletionProvider implements CompletionItemProvider {
  configuredProjects: Map<WorkspaceFolder, ConfiguredProject>
  constructor(configuredProjects: Map<WorkspaceFolder, ConfiguredProject>) {
    this.configuredProjects = configuredProjects
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList<CompletionItem> | CompletionItem[]> {
    throw new Error("Method not implemented.")
  }
  resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
    throw new Error("Method not implemented.")
  }
}
