import { MarkdownString, workspace, WorkspaceFolder } from 'vscode'
import { CancellationToken, Hover, HoverProvider, Position, ProviderResult, TextDocument } from "vscode"
import BrSourceDocument from "../class/BrSourceDocument"
import { getFunctionByName } from '../completions/functions'
import BrFunction from '../interface/BrFunction'
import { isComment } from "../util/common"
import { Project } from '../class/Project'
import UserFunction from '../class/UserFunction'
import InternalFunction from '../class/InternalFunction'

export default class BrHoverProvider implements HoverProvider {
  configuredProjects: Map<WorkspaceFolder, Project>
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    this.configuredProjects = configuredProjects
  }
  provideHover(doc: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
    const doctext = doc.getText()
    if (isComment(position, doctext, doc)){
      return			
    } else {
      const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/)
      if (wordRange){
        const word = doc.getText(wordRange)
        if (word){
          if (word.substring(0,2).toLowerCase() == "fn"){
            
            // local functions
            const localSource = new BrSourceDocument(doc.getText())
            for (const fn of localSource.functions) {
              if (fn.name.toLowerCase() == word.toLocaleLowerCase()){
                const hover = this.createHoverFromInternalFunction(fn)
                hover.range = wordRange
                return hover
              }
            }
            
            // library functions
            const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
            if (workspaceFolder){
              const project = this.configuredProjects.get(workspaceFolder)
              if (project){
                for (const [uri,lib] of project.sourceFiles) {
                  for (const fn of lib.functions) {
                    if (fn.name.toLowerCase() === word.toLocaleLowerCase()){
                      const hover = this.createHoverFromInternalFunction(fn)
                      hover.range = wordRange
                      return hover
                    }
                  }
                }
              }
            }
          }	else {
            // system functions
            const fn = getFunctionByName(word)
            if (fn){
              const hover = this.createHoverFromFunction(fn)
              hover.range = wordRange
              return hover
            }
          }					
        }

        // local functions
      }
    }
  
  }

  createHoverFromInternalFunction(fn: UserFunction): Hover {
    let markDownString = '```br\n' + fn.name + fn.generateSignature() + '\n```\n---'
  
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

  createHoverFromFunction(fn: InternalFunction): Hover {

    let markDownString = '```br\n' + fn.name + fn.generateSignature() + '\n```\n---'
  
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