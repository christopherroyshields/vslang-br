import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemLabel, CompletionList, CompletionTriggerKind, Position, Range, TextDocument, workspace, WorkspaceFolder } from "vscode"
import { getSearchPath } from "../util/common"
import BaseCompletionProvider from "./BaseCompletionProvider"
import { Project } from "../class/Project"
import BrParser from "../parser";

/**
* Library statement file path provider
*/
export default class LibPathProvider extends BaseCompletionProvider {
  parser: BrParser
  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    super(configuredProjects)
    this.parser = parser
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): CompletionList<CompletionItem> {
    const completionItems: CompletionList<CompletionItem> = new CompletionList()
    
    const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/)
    const pos = wordRange ? wordRange.start : position
    const posNode = this.parser.getNodeAtPosition(doc, pos)
    
    if (posNode){
      if (posNode.parent?.parent?.parent?.type==="library_statement"){
        const libNode = posNode.parent?.parent?.parent
        const pathQuery = `path: (string_expression 
          (string_primary_expression
              (string) @path))`
        
        const results = this.parser.match(pathQuery, libNode)
        if (results.length){
          
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
              const searchPath = getSearchPath(workspaceFolder)
              for (const [uri, lib] of project.sourceFiles) {
                if (lib.uri.fsPath.indexOf(searchPath.fsPath) === 0){
                  let hasLib = false
                  for (const fn of lib.functions) {
                    if (fn.isLibrary) {
                      hasLib = true
                      break;
                    }
                  }
                  if (hasLib){
                    const parsedPath = path.parse(lib.uri.fsPath.substring(searchPath.fsPath.length + 1))
                    const libPath = path.join(parsedPath.dir, parsedPath.name)
                    const itemLabel: CompletionItemLabel = {
                      label: libPath,
                      detail: parsedPath.ext
                    }
                    completionItems.items.push({
                      label: itemLabel
                    })
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