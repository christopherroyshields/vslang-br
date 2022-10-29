import { EOL } from "os"
import { BrFunction } from "../interface/BrFunction"
import { UserFunctionParameter } from "./UserFunctionParameter"

/**
 * User Defined BR Function found in source
 */
 export class UserFunction implements BrFunction {
  name: string
  isLibrary: boolean
  description?: string
  documentation?: string
  params?: UserFunctionParameter[]
  /**
   * @param name - function name
   */
  constructor(name: string, isLibrary: boolean) {
    this.name = name
    this.isLibrary = isLibrary
  }

  /**
   * 
   * @returns A composite of all comment documentation for display purposes for hover and completion
   */
	getAllDocs(): string | undefined {
    let docs: string | undefined
    if (this.documentation){
      docs = this.documentation + "\\"+EOL
    }
    if (this.params){
      for (let paramIndex = 0; paramIndex < this.params.length; paramIndex++) {
        const param = this.params[paramIndex];
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
  generateSignature() : string {
    let sig: string = ''
    if (this.params ?. length) {
      sig += '('
      for (let paramindex = 0; paramindex < this.params.length; paramindex++) {
        if (paramindex > 0) {
          sig += ','
        }
        const element = this.params[paramindex];
        let name = ''
        if (element.isReference) {
          name += '&'
        }
        name += element.name;
        if (element.length) {
          name += '*' + element.length.toString()
        }
        if (element.isOptional) {
          name = '[' + name + ']'
        }
        sig += name;
      }
      sig += ')'
    }
    return sig
  }

}
