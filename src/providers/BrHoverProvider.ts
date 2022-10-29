import { MarkdownString, workspace, WorkspaceFolder } from 'vscode';
import { CancellationToken, Hover, HoverProvider, Position, ProviderResult, TextDocument } from "vscode";
import { ConfiguredProject } from '../class/ConfiguredProject';
import { SourceLibrary } from "../class/SourceLibrary";
import { generateFunctionSignature, getFunctionByName } from '../completions/functions';
import { BrFunction } from '../interface/BrFunction';
import { isComment } from "../util/common";

export class BrHoverProvider implements HoverProvider {
  configuredProjects: Map<WorkspaceFolder, ConfiguredProject>
  constructor(configuredProjects: Map<WorkspaceFolder, ConfiguredProject>) {
    this.configuredProjects = configuredProjects
  }
  provideHover(doc: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
    const doctext = doc.getText()
    if (isComment(position, doctext, doc)){
      return			
    } else {
      const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/);
      if (wordRange){
        const word = doc.getText(wordRange)
        if (word){
          if (word.substring(0,2).toLowerCase() == "fn"){
            
            // local functions
            const localSource = new SourceLibrary(doc.uri, doc.getText())
            for (const fn of localSource.libraryList) {
              if (fn.name.toLowerCase() == word.toLocaleLowerCase()){
                const hover = this.createHoverFromFunction(fn)
                hover.range = wordRange
                return hover
              }
            }
            
            // library functions
            const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
            if (workspaceFolder){
              const project = this.configuredProjects.get(workspaceFolder)
              if (project){
                for (const [uri,lib] of project.libraries) {
                  for (const fn of lib.libraryList) {
                    if (fn.name.toLowerCase() === word.toLocaleLowerCase()){
                      const hover = this.createHoverFromFunction(fn)
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
  createHoverFromFunction(fn: BrFunction): Hover {

    let markDownString = '```br\n' + fn.name + generateFunctionSignature(fn) + '\n```\n---'
  
    if (markDownString && fn.documentation){
      markDownString += '\n' + fn.documentation
    }
  
    fn.params?.forEach((param)=>{
      if (param.documentation){
        markDownString += `\r\n * @param \`${param.name}\` ${param.documentation}`
      }
    })
  
    let markup = new MarkdownString(markDownString)
  
    return new Hover(markup)
  }
    
}