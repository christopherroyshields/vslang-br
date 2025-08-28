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
                // First check library index for library functions (fast, no parsing)
                // Try both with and without 'fn' prefix since library functions are stored without it
                let libFuncMetadata = project.libraryIndex.getFunction(posNode.text)
                if (!libFuncMetadata && posNode.text.toLowerCase().startsWith('fn')) {
                  // Try without the 'fn' prefix
                  libFuncMetadata = project.libraryIndex.getFunction(posNode.text.substring(2))
                }
                if (libFuncMetadata) {
                  // Found in index, now get the full function from the source document
                  const sourceDoc = project.sourceFiles.get(libFuncMetadata.uri.toString())
                  if (sourceDoc) {
                    const fn = await sourceDoc.getFunctionByName(posNode.text)
                    if (fn) {
                      const hover = this.createHoverFromFunction(fn)
                      hover.range = wordRange
                      return hover
                    }
                  }
                }
                
                // If not a library function, check current document for local functions
                const currentDocSource = project.sourceFiles.get(doc.uri.toString())
                if (currentDocSource) {
                  const fn = await currentDocSource.getFunctionByName(posNode.text)
                  if (fn && !fn.isLibrary) {
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