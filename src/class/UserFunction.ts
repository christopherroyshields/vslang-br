import { EOL } from "os"
import BrFunction from "../interface/BrFunction"
import { EntityOffset } from "./EntityOffset"
import UserFunctionParameter from "./UserFunctionParameter"
import { ParameterInformation, Range } from "vscode"
import { SyntaxNode } from "web-tree-sitter"
import { nodeRange } from "../util/common"
import { VariableType } from "../types/VariableType"

/**
 * User Defined BR Function found in source
 */
 export default class UserFunction implements BrFunction {
  name: string
  isLibrary: boolean
  description?: string
  documentation?: string
  params: UserFunctionParameter[] = []
  nameRange: Range
  offset: EntityOffset = {
    start: 0,
    end: 0
  }
  /**
   * @param name - function name
   * @param isLibrary - Is a library function
   * @param nameRange - Range of name text
   */
  constructor(name: string, isLibrary: boolean, nameRange: Range) {
    this.name = name
    this.isLibrary = isLibrary
    this.nameRange = nameRange
  }

  static fromNode(nameNode: SyntaxNode, defNode: SyntaxNode, params: SyntaxNode[]): UserFunction {
    let isLibrary = false
    if (defNode.firstChild?.type === "library_keyword"){
      isLibrary = true
    }
    const fn = new UserFunction(nameNode.text,isLibrary, nodeRange(nameNode))
    const reqs = defNode.descendantsOfType("required_parameter")
    if (reqs){
      const params = reqs[0].children
      for (const param of params) {
        const paramNode = param.namedChild(0)
        if (paramNode){
          const newParam = new UserFunctionParameter()
          newParam.name = paramNode?.text
          fn.params.push(new UserFunctionParameter())
        }
      }
    }
    return fn
  }

  /**
   * 
   * @returns A composite of all comment documentation for display purposes for hover and completion
   */
	getAllDocs(): string | undefined {
    let docs: string | undefined
    if (this.documentation?.trim().length){
      docs = this.documentation + "\\"+EOL
    }
    if (this.params){
      for (let paramIndex = 0; paramIndex < this.params.length; paramIndex++) {
        const param = this.params[paramIndex]
        if (param.documentation){
          if (paramIndex || docs){
            docs += "\\"+EOL
          }
          docs += `*@param* \`${param.name}\` ${param.documentation}`
        }
      }
    }
    return docs
  }
  generateSignature(paramInfo: ParameterInformation[] | undefined = undefined) : string {
    let sig = this.name
    if (this.params ?. length) {
      sig += '('
      for (let paramindex = 0; paramindex < this.params.length; paramindex++) {
        if (paramindex > 0) {
          sig += ','
        }
        const paramStart = sig.length
        const element = this.params[paramindex]
        let name = ''
        if (element.isReference) {
          name += '&'
        }
        name += element.name
        if (element.length) {
          name += '*' + element.length.toString()
        }
        if (element.isOptional) {
          name = '[' + name + ']'
        }
        sig += name
        const paramEnd = sig.length
        if (paramInfo){
          paramInfo.push({
            label: [paramStart, paramEnd],
            documentation: element.documentation
          })
        }
      }
      sig += ')'
    }
    return sig
  }

}
