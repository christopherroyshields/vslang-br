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

    // const selectedNode = this.parser.getNodeAtPosition(doc, position)
    // let isLibraryLiteral = false
    // if (selectedNode.type === "string" && selectedNode.parent?.parent?.parent?.parent?.type === "library_statement"){
    //   isLibraryLiteral = true
    // }

    const line = doc.getText(new Range(doc.lineAt(position).range.start, position))
    const ISLIBRARY_LITERAL = /library\s+(release\s*,)?(\s*nofiles\s*,)?\s*("|')$/gi
    if (ISLIBRARY_LITERAL.test(line)){
      const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
      if (workspaceFolder){
        const project = this.configuredProjects.get(workspaceFolder)
        if (project){
          const searchPath = getSearchPath(workspaceFolder)
          for (const [uri, lib] of project.sourceFiles) {
            if (lib.uri.fsPath.indexOf(searchPath.fsPath) === 0){
              const parsedPath = path.parse(lib.uri.fsPath.substring(searchPath.fsPath.length + 1))
              const libPath = path.join(parsedPath.dir, parsedPath.name)
              const itemLabel: CompletionItemLabel = {
                label: libPath,
                detail: parsedPath.ext.substring(0,parsedPath.ext.length-1)
              }
              completionItems.items.push({
                label: itemLabel
              })
            }
          }				
        }
      }
    }

    return completionItems
  }
}