import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionItemProvider, CompletionList, MarkdownString, Position, ProviderResult, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { Project } from "../class/Project"
import BrParser from "../parser";

class FunctionCompletionItem extends CompletionItem {
  name?: string
  uri?: Uri
  isLibrary = false
}

/**
 * Library statement linkage list completion provider
 */
export default class FuncCompletionProvider implements CompletionItemProvider<FunctionCompletionItem> {
  parser: BrParser
  configuredProjects: Map<WorkspaceFolder, Project>
  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): FunctionCompletionItem[] {
    const completionItems: FunctionCompletionItem[] = []

    let workspaceFolder: WorkspaceFolder | undefined = undefined;
    for (const [folder] of this.configuredProjects) {
      if (doc.uri.fsPath.startsWith(folder.uri.fsPath)) {
        workspaceFolder = folder;
        break;
      }
    }

    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
        // Use library index for fast access to all library functions
        const allLibraryFunctions = project.libraryIndex.getAllFunctions()
        for (const libFunc of allLibraryFunctions) {
          // Don't include functions from the current document
          if (libFunc.uri.toString() !== doc.uri.toString()) {
            // Library functions should be displayed with 'fn' prefix
            const displayName = 'fn' + libFunc.name;
            completionItems.push({
              name: displayName,
              kind: CompletionItemKind.Function,
              isLibrary: true,
              uri: libFunc.uri,
              label: {
                label: displayName,
                detail: ' (library function)',
                description: path.basename(libFunc.uri.fsPath)
              }
            })
          }
        }
      }
    }

    return completionItems
  }
  async resolveCompletionItem(item: FunctionCompletionItem, token: CancellationToken): Promise<FunctionCompletionItem> {
    console.log(`resolve: ${item.name}`);
    
    if (item.name && item.uri){
      const fn = await this.parser.getFunctionByName(item.name, item.uri)
      if (fn){
        item.detail = `(library function) ${fn.generateSignature()}`
        item.documentation = new MarkdownString(fn.getAllDocs())
        return item
      }
    }
    throw Error(`Can't find function definition for ${item.name} in ${item.uri?.path}`)
  }
}