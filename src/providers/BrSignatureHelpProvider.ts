import { CancellationToken, MarkdownString, ParameterInformation, Position, ProviderResult, Range, SignatureHelp, SignatureHelpContext, SignatureHelpProvider, SignatureInformation, TextDocument, workspace, WorkspaceFolder } from "vscode";
import ConfiguredProject from "../class/ConfiguredProject";
import BrSourceDocument from "../class/BrSourceDocument";
import { generateFunctionSignature, getFunctionsByName } from "../completions/functions";
import { FUNCTION_CALL_CONTEXT, STRING_LITERALS, stripBalancedFunctions } from "../util/common";
import ProjectSourceDocument from "../class/ProjectSourceDocument";

export default class BrSignatureHelpProvider implements SignatureHelpProvider {
  configuredProjects: Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>
  constructor(configuredProjects: Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>) {
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
          const localLib = new BrSourceDocument(doc.getText())
          
          for (const fn of localLib.functions) {
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
      
              const sigInfo = new SignatureInformation(fn.name + fn.generateSignature(), new MarkdownString(fn.documentation))
              sigInfo.parameters = params
              sigInfo.activeParameter = context.groups.params?.split(',').length - 1
              sigHelp.signatures.push(sigInfo)
              return sigHelp
            }
          }
  
          if (workspaceFolder){
            const project = this.configuredProjects.get(workspaceFolder)
            if (project){
              for (const [libUri,lib] of project) {
                if (libUri !== doc.uri.toString()){
                  for (const fn of lib.functions) {
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
              
                      const sigInfo = new SignatureInformation(fn.name + fn.generateSignature())
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