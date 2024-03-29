import { EOL } from "os"
import BrFunction from "../interface/BrFunction"
import FunctionParameter from "../interface/FunctionParameter"
import { ParameterInformation } from "vscode"

export default class InternalFunction implements BrFunction {
  name = ''
  description?: string
  documentation?: string
  params?: FunctionParameter[]
  constructor(
    name: string, 
    description?: string,
    documentation?: string,
    params?: FunctionParameter[]
  ) {
    this.name=name
    this.description=description
    this.documentation=documentation
    this.params=params
  }
  public generateSignature(paramInfo: ParameterInformation[] | undefined = undefined): string {
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
        name += element.name
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
	
  public getAllDocs(): string | undefined {
    let docs: string | undefined
    if (this.documentation){
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

  public static factory(fnList: BrFunction[]): InternalFunction[] {
    return fnList.map((fn)=>{
      return new InternalFunction(fn.name, fn.description, fn.documentation, fn.params)
    })
  }
}