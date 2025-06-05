import { MarkdownString, workspace, WorkspaceFolder } from 'vscode'
import { CancellationToken, Hover, HoverProvider, Position, ProviderResult, TextDocument } from "vscode"
import { getFunctionByName } from '../completions/functions'
import { Project } from '../class/Project'
import InternalFunction from '../class/InternalFunction'
import BrParser from '../parser'

export default class BrHoverProvider implements HoverProvider {
  parser: BrParser
  configuredProjects: Map<WorkspaceFolder, Project>
  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }
  async provideHover(doc: TextDocument, position: Position): Promise<Hover | undefined> {
    const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/)
    if (wordRange){
      const posNode = this.parser.getNodeAtPosition(doc, wordRange.start)
      if (posNode){
        if (posNode.type === "function_name"){
          // Internal/system functions
          if (posNode.parent?.type === "numeric_system_function" || posNode.parent?.type === "string_system_function"){
            const internalFunction = getFunctionByName(posNode.text)
            if (internalFunction){
              const hover = this.createHoverFromFunction(internalFunction)
              hover.range = wordRange
              return hover
            }
          } else {
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
                // First check current document for local functions
                const currentDocSource = project.sourceFiles.get(doc.uri.toString())
                if (currentDocSource) {
                  const fn = await currentDocSource.getFunctionByName(posNode.text)
                  if (fn) {
                    const hover = this.createHoverFromFunction(fn)
                    hover.range = wordRange
                    return hover
                  }
                }
                
                // Then check all other documents for library functions
                for (const [uri, lib] of project.sourceFiles) {
                  if (uri !== doc.uri.toString()) {
                    const fn = await lib.getFunctionByName(posNode.text)
                    if (fn && fn.isLibrary) {
                      const hover = this.createHoverFromFunction(fn)
                      hover.range = wordRange
                      return hover
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  createHoverFromFunction<T extends InternalFunction>(fn: T): Hover {
    let markDownString = '```br\n' + fn.generateSignature() + '\n```\n---'
    
    if (markDownString && fn.documentation){
      markDownString += '\n' + fn.documentation
    }
    
    fn.params?.forEach((param)=>{
      if (param.documentation){
        markDownString += `\r\n * @param \`${param.name}\` ${param.documentation}`
      }
    })
    
    const markup = new MarkdownString(markDownString)
    
    return new Hover(markup)
  }
}