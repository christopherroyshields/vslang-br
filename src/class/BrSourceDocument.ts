import path = require("path")
import { TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { BrParamType } from "../types/BrParamType"
import DocComment from "./DocComment"
import { getSearchPath } from "../util/common"
import ConfiguredProject from "./ConfiguredProject"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"

export default class BrSourceDocument {
	functions: UserFunction[]
	/** relative path for library statemtents */
	linkPath?: string
  static PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi
  static LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g
  static FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][^/]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))/gi

	constructor(text: string) {
		this.functions = this.parseFunctionsFromSource(text)
	}

  private parseFunctionsFromSource(sourceText: string): UserFunction[] {
    const functions: UserFunction[] = []
    let matches = sourceText.matchAll(BrSourceDocument.FIND_COMMENTS_AND_FUNCTIONS)
    for (const match of matches) {
      if (match.groups?.name){
        
        const isLib: boolean = match.groups?.isLibrary ? true : false
        const lib: UserFunction = new UserFunction(match.groups.name, isLib)
  
        let fnDoc: DocComment | undefined
        if (match.groups.comments) {
          fnDoc = DocComment.parse(match.groups.comments)
          lib.documentation = fnDoc.text
        }
        
        if (match.groups.params){
          lib.params = []
  
          // remove line continuations
          const params = match.groups.params.replace(BrSourceDocument.LINE_CONTINUATIONS, "")
          const it = params.matchAll(BrSourceDocument.PARAM_SEARCH)
  
          let isOptional = false
          for (const paramMatch of it) {
            if (paramMatch.groups && paramMatch.groups.name){
              
              if (paramMatch.groups.name.trim() == "___"){
                break
              }
  
              const libParam: UserFunctionParameter = new UserFunctionParameter()
              libParam.name = paramMatch.groups.name
              libParam.isReference = paramMatch.groups.isReference ? true : false
              libParam.isOptional = isOptional
  
              if (paramMatch.groups.isString){
                if (paramMatch.groups.isArray){
                  libParam.type = BrParamType.stringarray
                } else {
                  libParam.type = BrParamType.string
                  if (paramMatch.groups.length){
                    libParam.length = parseInt(paramMatch.groups.length)
                  }
                }
              } else {
                if (paramMatch.groups.isArray){
                  libParam.type = BrParamType.numberarray
                } else {
                  libParam.type = BrParamType.number
                }
              }
              
              if (fnDoc?.params){
                libParam.documentation = fnDoc.params.get(paramMatch.groups.name)
              }
  
              lib.params.push(libParam)
              
              if (!isOptional && paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';'){
                isOptional = true
              }
            }
          }
        }
        functions.push(lib)
      }
    }
    return functions
  }
  
  
}

