import { VariableType } from "../types/VariableType"
import DocComment from "./DocComment"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"
import { Statements } from "../statements";
import { BrVariable } from "./BrVariable";
import { Range } from "vscode";

type LineLabel = {
  name: string
  offset: {
    start: number
    end: number
  }
}

export default class BrSourceDocument {
	functions: UserFunction[] = []
  variables: BrVariable[]
  labels: LineLabel[] = []
	/** relative path for library statemtents */
	linkPath?: string
  static PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi
  static LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g
  static FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][\s\S]*?\*\/)|(?:(?:(?:\/\*\*(?<comments>[\s\S]+?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>lib\w*)\s+)?(?<name>\w*\$?) *(\* *\d+ *)?(?:\((?<params>[!&\w$, ;*\r\n\t@]+)\))?(?<fnBody>\s*=.*|[\s\S]*?fnend)?))/gi
  static FILL = " "

	constructor(text: string) {
    this.variables = this.parseVariables(text)
	}

  private static test(){

  }

  private parseVariables(text: string): BrVariable[] {
    let varList:BrVariable[] = []

    const fillString = BrSourceDocument.FILL

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

    text = text.replace(/(^|\r?\n|!:) *rem\b.*/gi, (match, p1) => {
      return p1 + fillString.repeat(match.length - p1.length) 
    })

    text = text.replace(/!_?.*(?<linend>\r?\n|!:|$)/g, (match, p1) => {
      if (match.length >= 2 && match.substring(0,2) === "!_"){
        return " ".repeat(match.length)
      } else {
        return fillString.repeat(match.length - p1.length) + p1
      }
    })

    text = text.replace(/(^|\r?\n)\s*\d{1,5} /g, (match, p1) => {
      return p1 + fillString.repeat(match.length - p1.length) 
    })

    const LABEL_SEARCH = /(?<=^|\r?\n) *(?<name>[a-zA-Z_]\w{0,29}): *(?=[\w!])/g
    for (const match of text.matchAll(LABEL_SEARCH)) {
      if (match.groups?.name && match.index !== undefined){
        const label: LineLabel = {
          name: match.groups.name,
          offset: {
            start: match.index,
            end: match[0].length
          }
        }
      }
      if (match.index !== undefined){
        text = text.substring(0, match.index) + fillString.repeat(match[0].length) + text.substring(match.index + match[0].length, text.length)
      }
    }

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
          const references = this.paramReferences(newFunc)
          varList = varList.concat(references)
        }
      }
      if (match.index !== undefined){
        text = text.substring(0, match.index) + fillString.repeat(match[0].length) + text.substring(match.index + match[0].length, text.length)
      }
    }

    const globalReferences = this.getRefs(text)
    // varList = varList.concat(globalReferences)
    return varList
  }

  private paramReferences(fn: UserFunction): BrVariable[] {
    const references = this.getRefs(fn.body)
    const filteredReferences = references.filter((value, index, self)=>{
      for (const param of fn.params) {
        if (value.name === param.name){
          return false
        } else {
          return true
        }
      }
    })
    return references
  }

  static VAR_SEARCH = /(?<ismat>mat +)?(?<name>[a-zA-Z_][\w\d]*(?<isString>\$?))/gi
  getRefs(text: string): BrVariable[] {
    const varList: BrVariable[] = []

    // text = this.removeStripables(text)
    // text = this.removeUserFn(text)

    const varMatches = text.matchAll(BrSourceDocument.VAR_SEARCH)
    let varType: VariableType
    for (const match of varMatches) {
      if (match.groups?.name){
        if (match.groups.isString){
          if (match.groups.ismat){
            varType = VariableType.stringarray
          } else {
            varType = VariableType.string
          }
        } else {
          if (match.groups.ismat){
            varType = VariableType.numberarray
          } else {
            varType = VariableType.number
          }
        }
        const newVar: BrVariable = {
          name: match[0].replace(/ +/g, " "),
          type: varType
        }
        varList.push(newVar)
      }

      // if (match.index !== undefined){
      //   text = text.substring(0, match.index) + BrSourceDocument.FILL.repeat(match[0].length) + text.substring(match.index + match[0].length, text.length)
      // }
    }

    return varList
  }

  private USERFN = /\bfn\w[\w\d]*\$?/gi
  private removeUserFn(text: string): string {
    text = text.replace(this.USERFN, (match) => {
      return BrSourceDocument.FILL.repeat(match.length) ;
    })

    return text
  }

  static STRIPABLE = [
    /\b(Abs|AIdx|Atn|Bell|Ceil|CmdKey|Cnt|Code|CoS|CurCol|CurFld|CurPos|CurRow|CurTab|CurWindow|Date|Days|Debug_Str|DIdx|Err|Exists|Exp|File|FileNum|FKey|FP|FreeSp|Inf|Int|IP|KLn|KPs|KRec|Len|Line|Lines|LineSPP|Log|LRec|Mat2Str|Max|Min|Mod|Msg|MsgBox|NewPage|Next|NxtCol|Nxtfld|NxtRow|Ord|Pi|Pos|Printer_List|ProcIn|Rec|Rem|RLn|Rnd|Round|Serial|SetEnv|Sgn|Sin|Sleep|Sqr|Srch|Str2Mat|Sum|Tab|Tan|Timer|UDim|Val|Version)\b/gi,
    /\b(BR_FileName\$|BRErr\$|CForm\$|Chr\$|Cnvrt\$|Date\$|Decrypt\$|Encrypt\$|Env\$|File\$|Help\$|Hex\$|KStat\$|Login_Name\$|LPad\$|LTrm\$|Lwrc\$|Max\$|Min\$|Msg\$|OS_FileName\$|Pic\$|Program\$|RPad\$|Rpt\$|RTrm\$|Session\$|SRep\$|Str\$|Time\$|Trim\$|UnHex\$|UprC\$|UserID\$|Variable\$|WBPlatform\$|WBVersion\$|WSID\$|Xlate\$)/gi,
    /\b(if|then|else|end if|for|next|do|while|loop|until|exit do)\b/gi,
    /\b(ALTERNATE|ATTR|BASE|BORDER|DROP|EVENT|EXTERNAL|FILES|INTERNAL|INVP|KEYED|NATIVE|NOFILES|NOKEY|NONE|OUTIN|OUTPUT|RELATIVE|RELEASE|RESERVE|RESUME|RETAIN|SEARCH|SELECT|SEQUENTIAL|SHIFT|TO|USE|USING)\b/gi,
    /\b(CONV|DUPREC|EOF|EOL|ERROR|IOERR|LOCKED|NOKEY|NOREC|IGNORE|OFLOW|PAGEOFLOW|SOFLOW|ZDIV|TIMEOUT)\b/gi,
  ]

  static STATEMENTS = /(^\s*|\r?\n\s*|!:\s*)\b(CHAIN|CLOSE|CONTINUE|DATA|DEF|DELETE|DIM|DISPLAY|END|END DEF|EXECUTE|EXIT|FIELDS|FNEND|FORM|GOSUB|GOTO|INPUT|KEY|LET|LIBRARY|LINPUT|MENU|MENU TEXT|MENU DATA|MENU STATUS|ON ERROR|ON FKEY|ON|OPEN|OPTION|PAUSE|PRINT|USING|BORDER|RANDOMIZE|READ|REREAD|RESTORE|RETRY|RETURN|REWRITE|RINPUT|SCR_FREEZE|SCR_THAW|SELECT|STOP|WRITE|TRACE|USE)\b/gi

  private removeStripables(text: string): string {

    for (const stripSearch of BrSourceDocument.STRIPABLE) {
      text = text.replace(stripSearch, (match) => {
        return BrSourceDocument.FILL.repeat(match.length) ;
      })
    }

    text = text.replace(BrSourceDocument.STATEMENTS, (match, p1) => {
      return p1 + BrSourceDocument.FILL.repeat(match.length) ;
    })

    return text
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

