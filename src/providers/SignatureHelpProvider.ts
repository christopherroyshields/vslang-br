import { CancellationToken, MarkdownString, ParameterInformation, Position, ProviderResult, Range, SignatureHelp, SignatureHelpContext, SignatureHelpProvider, SignatureInformation, TextDocument, workspace, WorkspaceFolder } from "vscode";
import { ConfiguredProject } from "../class/ConfiguredProject";
import { SourceLibrary } from "../class/SourceLibrary";
import { generateFunctionSignature, getFunctionsByName } from "../completions/functions";
import { FUNCTION_CALL_CONTEXT, STRING_LITERALS, stripBalancedFunctions } from "../util/common";

export class BrSignatureHelpProvider implements SignatureHelpProvider {
  configuredProjects: Map<WorkspaceFolder, ConfiguredProject>
  /**
   *
   */
  constructor(configuredProjects: Map<WorkspaceFolder, ConfiguredProject>) {
    this.configuredProjects = configuredProjects
  }

  provideSignatureHelp(doc: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext): ProviderResult<SignatureHelp | undefined> {
    let preText = doc.getText(new Range(doc.positionAt(0), position))
    // strip functions with params
    if (preText){
      // remove literals first
      preText = preText.replace(STRING_LITERALS, "")
      preText = stripBalancedFunctions(preText)
      let context: RegExpExecArray | null = FUNCTION_CALL_CONTEXT.exec(preText)
      if (context && context.groups && !context.groups.isDef){
  
        const sigHelp: SignatureHelp = {
          signatures: [],
          activeSignature: 0,
          activeParameter: 0
        }
  
        if (context.groups.name.substring(0,2).toLocaleLowerCase()==="fn"){
          const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
          const localLib = new SourceLibrary(doc.uri, doc.getText())
          
          for (const fn of localLib.libraryList) {
            if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()){
              const params: ParameterInformation[] = []
              if (fn && fn.params){
                for (const param of fn.params) {
                  params.push({
                    label: param.name,
                    documentation: param.documentation
                  })
                }
              }
      
              const sigInfo = new SignatureInformation(fn.name + generateFunctionSignature(fn), new MarkdownString(fn.documentation))
              sigInfo.parameters = params
              sigInfo.activeParameter = context.groups.params?.split(',').length - 1
              sigHelp.signatures.push(sigInfo)
            }
          }
  
          if (workspaceFolder){
            const project = this.configuredProjects.get(workspaceFolder)
            if (project){
              for (const [libUri,lib] of project.libraries) {
                if (libUri !== doc.uri.toString()){
                  for (const fn of lib.libraryList) {
                    if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()){
                      const params: ParameterInformation[] = []
                      if (fn && fn.params){
                        for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
                          const el = fn.params[paramIndex];
                          params.push({
                            label: el.name,
                            documentation: el.documentation
                          })
                        }
                      }
              
                      const sigInfo = new SignatureInformation(fn.name + generateFunctionSignature(fn))
                      sigInfo.parameters = params
                      sigInfo.activeParameter = context.groups.params?.split(',').length - 1
                      sigHelp.signatures.push(sigInfo)
                    }
                  }
                }
              }
            }
          }
        } else {
          const internalFunctions = getFunctionsByName(context.groups.name)
          if (internalFunctions){
            for (const fn of internalFunctions) {
              let params: ParameterInformation[] = []
              if (fn && fn.params){
                for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
                  let el = fn.params[paramIndex];
                  params.push({
                    label: el.name,
                    documentation: el.documentation
                  })
                }
              }
        
              sigHelp.signatures.push({
                label: fn.name + generateFunctionSignature(fn),
                parameters: params,
                activeParameter: context.groups.params?.split(',').length - 1
              })
            }
          }
        }
  
        return sigHelp
        
      } else {
        // not in function call with parameters
        return
      }
    }
  }
}