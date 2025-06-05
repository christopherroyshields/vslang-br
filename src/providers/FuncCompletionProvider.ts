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
        for (const [uri, lib] of project.sourceFiles) {
          if (uri !== doc.uri.toString()){
            for (const fn of lib.functions){
              if (fn.isLibrary){
                completionItems.push({
                  name: fn.name,
                  kind: CompletionItemKind.Function,
                  isLibrary: true,
                  uri: lib.uri,
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