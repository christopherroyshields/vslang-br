import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionItemProvider, CompletionList, MarkdownString, Position, ProviderResult, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { Project, ProjectManager } from "../class/Project"
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
      if (doc.uri.fsPath.toLowerCase().startsWith(folder.uri.fsPath.toLowerCase())) {
        workspaceFolder = folder;
        break;
      }
    }

    if (workspaceFolder){
      // Check if we have a ProjectManager (lazy loading)
      const projectManagers = (global as any).projectManagers as Map<WorkspaceFolder, ProjectManager> | undefined;
      const projectManager = projectManagers?.get(workspaceFolder);
      
      if (projectManager) {
        // Use lazy loading approach - just get function names from lightweight docs
        for (const [uriString, lightDoc] of projectManager.lightweightDocs) {
          if (uriString !== doc.uri.toString() && lightDoc.isLibraryFile()) {
            const uri = Uri.parse(uriString);
            for (const funcName of lightDoc.libraryFunctions) {
              completionItems.push({
                name: funcName,
                kind: CompletionItemKind.Function,
                isLibrary: true,
                uri: uri,
                label: {
                  label: funcName,
                  detail: ' (library function)',
                  description: path.basename(uri.fsPath)
                }
              });
            }
          }
        }
      } else {
        // Fallback to old approach
        const project = this.configuredProjects.get(workspaceFolder)
        if (project){
          for (const [uri, lib] of project.sourceFiles) {
            if (uri !== doc.uri.toString()){
              for (const [fnKey, userFn] of lib.functions){
                if (fnKey.isLibrary){
                  completionItems.push({
                    name: fnKey.name,
                    kind: CompletionItemKind.Function,
                    isLibrary: true,
                    uri: lib.uri,
                    label: {
                      label: fnKey.name,
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