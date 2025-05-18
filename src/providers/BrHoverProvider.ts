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
          // local functions
          if (posNode.parent?.type === "numeric_system_function" || posNode.parent?.type === "string_system_function"){
            const internalFunction = getFunctionByName(posNode.text)
            if (internalFunction){
              const hover = this.createHoverFromFunction(internalFunction)
              hover.range = wordRange
              return hover
            }
          } else {
            const fn = await this.parser.getFunctionByName(posNode.text, doc.uri)

            if (fn) {
              const hover = this.createHoverFromFunction(fn)
              hover.range = wordRange
              return hover
            }

            // library functions
            const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
            if (workspaceFolder){
              const project = this.configuredProjects.get(workspaceFolder)
              if (project){
                for (const [uri,lib] of project.sourceFiles) {
                  for (const fn of lib.functions) {
                    if (fn.isLibrary && fn.name.toLowerCase() === posNode.text.toLocaleLowerCase()){
                      const fn = await this.parser.getFunctionByName(posNode.text, lib.uri)
                      if (fn){
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