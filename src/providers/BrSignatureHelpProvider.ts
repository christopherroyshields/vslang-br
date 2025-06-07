import { CancellationToken, MarkdownString, ParameterInformation, Position, ProviderResult, Range, SignatureHelp, SignatureHelpContext, SignatureHelpProvider, SignatureInformation, TextDocument, workspace, WorkspaceFolder } from "vscode"
import { getFunctionsByName } from "../completions/functions"
import { escapeRegExpCharacters, FUNCTION_CALL_CONTEXT, nodeRange, STRING_OR_COMMENT, stripBalancedFunctions } from "../util/common"
import { Project } from "../class/Project"
import BrParser from "../parser"
import { SyntaxNode } from "tree-sitter"

/**
 * Provides signature help for function calls in BR files.
 * Implements the VS Code SignatureHelpProvider interface to show parameter info
 * when typing function calls.
 */

export default class BrSignatureHelpProvider implements SignatureHelpProvider {
  configuredProjects: Map<WorkspaceFolder, Project>
  parser: BrParser
  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }

  /**
   * Recursively searches up the syntax tree to find a parent node of the specified type(s)
   * @param node The starting syntax node to search from
   * @param type A string or array of strings specifying the node type(s) to find
   * @returns The first matching parent node, or undefined if no match found
   */
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

  lastGoodPosition(doc: TextDocument, position: Position): SyntaxNode | null {
    let posNode = this.parser.getNodeAtPosition(doc, position)
    // If the parens are unclosed or the line is in error we need to move back to the last valid position
    if (posNode && (posNode.type === "source_file" || posNode.type === "ERROR")) {
      while (position.character > 0 && posNode && (posNode.type === "source_file" || posNode.type === "ERROR")) {
        // move position back one character
        position = position.translate(0, -1)
        posNode = this.parser.getNodeAtPosition(doc, position)
      }
    }
    return posNode
  }

  async provideSignatureHelp(doc: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext): Promise<SignatureHelp | undefined> {

    const posNode = this.parser.getNodeAtPosition(doc, position)
    if (!posNode) {
      return undefined
    }
    
    let argList = undefined
    if (posNode && posNode.type === "arguments"){
      argList = posNode
    } else if (posNode) {
      argList = posNode
      argList = this.getParentByType(posNode, "arguments")
    }

    if (!argList){
      return undefined
    }

    const call = this.getParentByType(argList, ["string_user_function", "numeric_user_function", "numeric_system_function", "string_system_function"])

    if (!call){
      return undefined
    }

    const name = call.firstNamedChild
    if (!name){
      return undefined
    }

    const activeParameter = this.getActiveParameter(call, position)

    const sigHelp: SignatureHelp = {
      signatures: [],
      activeSignature: 0,
      activeParameter: 0
    }

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

  /**
   * Gets the index of the active parameter based on cursor position in a function call
   * @param callNode The syntax node representing the function call
   * @param position The current cursor position
   * @returns The zero-based index of the active parameter
   */
  getActiveParameter(callNode: SyntaxNode, position: Position): number {
    const args = callNode.childForFieldName("arguments")?.children
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