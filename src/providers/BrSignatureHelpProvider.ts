import { CancellationToken, MarkdownString, ParameterInformation, Position, ProviderResult, Range, SignatureHelp, SignatureHelpContext, SignatureHelpProvider, SignatureInformation, TextDocument, workspace, WorkspaceFolder } from "vscode"
import ConfiguredProject from "../class/ConfiguredProject"
import BrSourceDocument from "../class/BrSourceDocument"
import { getFunctionsByName } from "../completions/functions"
import { escapeRegExpCharacters, FUNCTION_CALL_CONTEXT, nodeRange, STRING_OR_COMMENT, stripBalancedFunctions } from "../util/common"
import ProjectSourceDocument from "../class/ProjectSourceDocument"
import { Project } from "../class/Project"
import { VariableType } from "../types/VariableType"
import BrParser from "../parser"
import { SyntaxNode } from "tree-sitter"

export default class BrSignatureHelpProvider implements SignatureHelpProvider {
  configuredProjects: Map<WorkspaceFolder, Project>
  parser: BrParser
  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }

  getParentByType(node: SyntaxNode, type: string | string[]): SyntaxNode | undefined {
    const parent = node.parent
    if (parent){
      if (typeof type === "object"){
        for (const t of type) {
          if (parent.type === t){
            return parent
          }
        }
        return this.getParentByType(parent, type)
      } else {
        if (parent.type === type){
          return parent
        } else {
          return this.getParentByType(parent, type)
        }
      }
    }
  }

  async provideSignatureHelp(doc: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext): Promise<SignatureHelp | undefined> {
    const posNode = this.parser.getNodeAtPosition(doc, position)
    if (posNode){
      let argList = undefined
      if (posNode.type === "arguments"){
        argList = posNode
      } else {
        argList = this.getParentByType(posNode, "arguments")
      }
      if (argList){
        const call = this.getParentByType(argList, ["string_user_function", "numeric_user_function", "numeric_system_function", "string_system_function"])
        if (call){
          const sigHelp: SignatureHelp = {
            signatures: [],
            activeSignature: 0,
            activeParameter: 0
          }
  
          const activeParameter = this.getActiveParameter(call, position)
          const name = call.firstNamedChild
          if (name){
            if (call.type === "numeric_system_function" || call.type === "string_system_function"){
              const internalFunctions = getFunctionsByName(name.text)
              if (internalFunctions){
                for (const fn of internalFunctions) {
                  const params: ParameterInformation[] = []
                  const sigLabel = fn.generateSignature(params)
    
                  sigHelp.signatures.push({
                    documentation: fn.documentation,
                    label: sigLabel,
                    parameters: params,
                    activeParameter: activeParameter
                  })
    
                  return sigHelp
                }
              }
            } else {
              const fn = await this.parser.getFunctionByName(name.text, doc.uri)
              if (fn) {
                const params: ParameterInformation[] = []
                const sigLabel = fn.generateSignature(params)
                sigHelp.signatures.push({
                  documentation: fn.documentation,
                  label: sigLabel,
                  parameters: params,
                  activeParameter: activeParameter
                })
                return sigHelp
              }
  
              const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
              if (workspaceFolder){
                const project = this.configuredProjects.get(workspaceFolder)
                if (project){
                  for (const [libUri,lib] of project.sourceFiles) {
                    if (libUri !== doc.uri.toString()){
                      for (const fnKey of lib.functions) {
                        if (fnKey.isLibrary && fnKey.name.toLowerCase() == name.text.toLowerCase()){
                          const fn = await this.parser.getFunctionByName(fnKey.name, lib.uri)
                          if (fn){
                            const params: ParameterInformation[] = []
                            const sigLabel = fn.generateSignature(params)
                            sigHelp.signatures.push({
                              documentation: fn.documentation,
                              label: sigLabel,
                              parameters: params,
                              activeParameter: activeParameter
                            })
                          }
                        }
                      }
                    }
                  }
                }
              }
  
              return sigHelp
            }
          }
        }
      }
    }
  }

  getActiveParameter(call: SyntaxNode, position: Position): number {
    const args = call.childForFieldName("arguments")?.children
    let activeParameter = 0
    if (args?.length) {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg){
          if (arg.text === ","){
            const sepRange = nodeRange(arg)
            if (sepRange.end.isBeforeOrEqual(position)){
              activeParameter += 1
            }
          }
        }
      }
    }
    console.log(`active parameter: ${activeParameter}`);
    return activeParameter
  }
}