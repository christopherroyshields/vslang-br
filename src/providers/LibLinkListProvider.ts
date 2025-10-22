import { CancellationToken, CompletionContext, CompletionItem, CompletionList, CompletionTriggerKind, Position, Range, TextDocument, workspace, WorkspaceFolder } from "vscode"
import BaseCompletionProvider from "./BaseCompletionProvider"
import { Project } from "../class/Project"

/**
* Library statement linkage list completion provider
*/
export default class LibLinkListProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): CompletionList<CompletionItem> {
    const completionItems: CompletionList<CompletionItem> = new CompletionList()
    
    if (context.triggerKind === CompletionTriggerKind.TriggerCharacter){
      const line = doc.getText(new Range(doc.lineAt(position).range.start, position))
      const ISLIBRARY_LINKAGE_LIST = /library(\s+(release\s*,)?(\s*nofiles\s*,)?\s*(?<libPath>"[\w\\]+"|'[\w\\]+')?)\s*:\s*(?<fnList>[a-z_, $]*)?$/i
      const match = line.match(ISLIBRARY_LINKAGE_LIST)
      if (match?.groups){
        const libPath = match.groups.libPath.replace(/'|"/g, '')
        
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
            for (const [uri,lib] of project.sourceFiles) {
              if (lib.linkPath?.toLowerCase() == libPath.toLowerCase().replace(/\.[^\\/.]+$/,"")){
                for (const [fnKey, userFn] of lib.functions) {
                  if (fnKey.isLibrary){
                    if (match.groups.fnList){
                      const lineSearch = new RegExp("\\b"+fnKey.name.replace("$","\\$")+"(,|\\s|$)", "i")
                      if (!lineSearch.test(match.groups.fnList)){
                        completionItems.items.push({
                          label: fnKey.name
                        })
                      }
                    } else {
                      completionItems.items.push({
                        label: fnKey.name
                      })
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return completionItems
  }
}