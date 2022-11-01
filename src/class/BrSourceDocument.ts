import path = require("path")
import { TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { VariableType } from "../types/VariableType"
import DocComment from "./DocComment"
import { getSearchPath } from "../util/common"
import ConfiguredProject from "./ConfiguredProject"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"
import { type } from "os"

interface BrVariable {
  name: string
  type: VariableType
}

export default class BrSourceDocument {
	functions: UserFunction[]
  variables: BrVariable[]
	/** relative path for library statemtents */
	linkPath?: string
  static PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi
  static LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g
  static FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][\s\S]*?\*\/)|(?:(?:(?:\/\*\*(?<comments>[\s\S]+?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?(?<fnBody>\s*=.*|[\s\S]*?fnend)?))/gi

	constructor(text: string) {
		this.functions = []
    this.variables = this.parseVariables(text)
	}

  private parseVariables(text: string): BrVariable[] {
    const varList:BrVariable[] = []

    const fillString = "@"

    text = text.replace(/!_?.*/g, (match) => {
      if (match.length >= 2 && match.substring(0,2) === "!_"){
        return '!_' + fillString.repeat(match.length-2)
      } else {
        return fillString.repeat(match.length)
      }
    })

    text = text.replace(/".*?"/g, (match) => {
      return fillString.repeat(match.length)
    })

    text = text.replace(/'.*?'/g, (match) => {
      return fillString.repeat(match.length)
    })

    text = text.replace(/`[\s\S]*?`/g, (match) => {
      return fillString.repeat(match.length)
    })

    text = text.replace(/`[\s\S]*?{{/g, (match) => {
      return fillString.repeat(match.length) 
    })

    text = text.replace(/}}[\s\S]*?`/g, (match) => {
      return fillString.repeat(match.length) 
    })

    text = text.replace(/}}[\s\S]*?{{/g, (match) => {
      return fillString.repeat(match.length) 
    })

    // if unbalanced string return empty to prevent chaos
    if (/'|"|`/.test(text)){
      return []
    }

    const fnMatches = text.matchAll(BrSourceDocument.FIND_COMMENTS_AND_FUNCTIONS)
    for (const match of fnMatches) {
      if (match.groups?.name){
        const newFunc = this.parseFunctionFromSource(match.groups.name, match)
        if (newFunc){
          this.functions.push(newFunc)
        }
      }
      if (match.index !== undefined){
        text = text.substring(0, match.index) + fillString.repeat(match[0].length) + text.substring(match.index + match[0].length, text.length)
      }
    }

    const matches = text.matchAll(/[a-zA-Z_][\w\d]*(?<isString>\$?)/g)
    for (const wordMatch of matches) {
      let varType: VariableType = wordMatch[1] ? VariableType.string : VariableType.number
      const newVar: BrVariable = {
        name: wordMatch[0],
        type: varType
      }
      varList.push(newVar)
    }

    return varList
  }

  private parseFunctionFromSource(name: string, match: RegExpMatchArray): UserFunction | undefined {
    if (match.groups){
      const isLib: boolean = match.groups?.isLibrary ? true : false
      const lib: UserFunction = new UserFunction(match.groups.name, isLib)
      
      if (match.groups.fnBody){
        lib.body = match.groups.fnBody
      }
  
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
                libParam.type = VariableType.stringarray
              } else {
                libParam.type = VariableType.string
                if (paramMatch.groups.length){
                  libParam.length = parseInt(paramMatch.groups.length)
                }
              }
            } else {
              if (paramMatch.groups.isArray){
                libParam.type = VariableType.numberarray
              } else {
                libParam.type = VariableType.number
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
      return lib
    }
  }
  
  
}

