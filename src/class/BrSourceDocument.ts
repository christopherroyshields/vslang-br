import { VariableType } from "../types/VariableType"
import DocComment from "./DocComment"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"
import { BrVariable } from "./BrVariable";
import { LineLabel } from "./LineLabel";

export default class BrSourceDocument {
	functions: UserFunction[] = []
  variables = new Map<string,BrVariable>()
  labels: LineLabel[] = []
	/** relative path for library statemtents */
	linkPath?: string
  lastDocComment: DocComment | null = null
  static LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g

	constructor(text: string = "") {
    if (text){
      this.parse(text)
    }
	}

  static VALID_LINE = /(?<lpad>(^|\r?\n) *)(?<lineNum>\d{1,5})? *(?:(?<labelName>[a-zA-Z_]\w*):(?= *[^ ]))?(?= *[^ \r?\n])/g
  static SKIP_OR_WORD = /((?<skippable>".*?"|'.*?'|!_?|rem\b.*|\/\*[\s\S]*?\*\/)|(mat +)?[a-z_]\w*\$?|(?<end>\r?\n))/gi
  private parse(text: string){
    let validLineStart
    let lineCount = 0
    while ((validLineStart = BrSourceDocument.VALID_LINE.exec(text)) !== null) {
      lineCount+=1
      let lineStart = true
      let matchEnd = BrSourceDocument.VALID_LINE.lastIndex
      BrSourceDocument.SKIP_OR_WORD.lastIndex = matchEnd

      if (validLineStart.groups?.labelName){
        this.processLabel(validLineStart.groups, validLineStart.index)
      }

      let skipOrWord: RegExpExecArray | null
      while ((skipOrWord = BrSourceDocument.SKIP_OR_WORD.exec(text)) !== null) {
        if (skipOrWord.groups?.end){
          matchEnd = skipOrWord.index
          break
        }
        if (skipOrWord.groups?.skippable){
          if (skipOrWord[0].substring(0,3)==="/**"){
            matchEnd = skipOrWord.index 
            this.processDocComment(skipOrWord[0], skipOrWord.index)
          }
          if (skipOrWord[0].substring(0,1)==="!"){
            if (skipOrWord[0].substring(2,1)==="_"){
              matchEnd = this.processLineContinuation(text, skipOrWord.index)
            } else {
              matchEnd = this.processRegularComment(text, skipOrWord.index)
              break
            }
          } else {
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
          }
        } else {
          if (lineStart){
            matchEnd = this.processStatement(skipOrWord[0], text, skipOrWord.index)
            lineStart = false
          } else {
            matchEnd = this.processWord(skipOrWord[0], text, skipOrWord.index)
          }
        }
        BrSourceDocument.SKIP_OR_WORD.lastIndex = matchEnd
      }
      BrSourceDocument.VALID_LINE.lastIndex = matchEnd
    }
  }
  
  private processDocComment(text: string, index: number): void {
    this.lastDocComment = DocComment.parse(text)
  }

  private processLabel({labelName, lpad}: { [key: string]: string}, index: number) {
    this.labels.push({
      name: labelName,
      offset: {
        start: index + lpad.length,
        end: index + lpad.length + labelName.length
      }
    })
  }

  static CONTINUATION_END = /\r?\n/g
  private processLineContinuation(text: string, index: number): number {
    BrSourceDocument.CONTINUATION_END.lastIndex = index
    const match = BrSourceDocument.CONTINUATION_END.exec(text)
    if (match){
      return BrSourceDocument.CONTINUATION_END.lastIndex
    } else {
      return index + text.length
    }
  }
  
  private static STATEMENT_TEST = /^(MAT|CHAIN|CLOSE|CONTINUE|DATA|DEF|DELETE|DIM|DISPLAY|END|END DEF|EXECUTE|EXIT|FIELDS|FNEND|FORM|GOSUB|GOTO|INPUT|KEY|LET|LIBRARY|LINPUT|MENU|MENU TEXT|MENU DATA|MENU STATUS|ON ERROR|ON FKEY|ON|OPEN|OPTION|PAUSE|PRINT|USING|BORDER|RANDOMIZE|READ|REREAD|RESTORE|RETRY|RETURN|REWRITE|RINPUT|SCR_FREEZE|SCR_THAW|SELECT|STOP|WRITE|TRACE|USE)$/i
  private processStatement(statement: string, text: string, index: number): number {
    if (statement.toLowerCase()=="def"){
      return this.processFunction(text, index)
    }
    if (BrSourceDocument.STATEMENT_TEST.test(statement)){
      return index + statement.length
    } else {
      return this.processWord(statement, text, index)
    }
  }

  private static DEF_FN = /def\s+(?:(?<isLibrary>lib\w*)\s+)?(?<name>\w*\$?) *(\* *\d+ *)?(?:\((?<params>[!&\w$, ;*\r\n\t@\[\]]+)\))?(?<fnBody>\s*=.*|[\s\S]*?fnend)/gi
  private processFunction(text: string, index: number): number {
    BrSourceDocument.DEF_FN.lastIndex = index
    const match = BrSourceDocument.DEF_FN.exec(text)
    if (match?.groups?.name){
      const fn = this.parseFunctionFromSource(match.groups.name, match)
      if (fn){
        fn.offset.start = index
        fn.offset.end = index + match[0].length
        this.functions.push(fn)
      }
      return index + match[0].length - match.groups.fnBody.length
    } else {
      return index + 3
    }
  }

  private processWord(match: string, text: string, index: number): number {
    if (match.substring(0,2).toLowerCase() == "fn") {
      return index + match.length
    }
  
    if (this.isKeyword(match)){
      return index + match.length
    }

    let variableType: VariableType
    if (match.substring(0,3).toLowerCase() === "mat"){
      if (match.substring(match.length-1) === "$"){
        variableType = VariableType.stringarray
      } else {
        variableType = VariableType.numberarray
      }
    } else {
      if (match.substring(match.length-1) === "$"){
        variableType = VariableType.string
      } else {
        variableType = VariableType.number
      }
    }

    const ref: BrVariable = {
      name: match,
      type: variableType
    }
    this.variables.set(match.toLowerCase(), ref)
    return index + match.length
  }

  private static FN_AND_KEYWORDS = [
    /^(Abs|AIdx|Atn|Bell|Ceil|CmdKey|Cnt|Code|CoS|CurCol|CurFld|CurPos|CurRow|CurTab|CurWindow|Date|Days|Debug_Str|DIdx|Err|Exists|Exp|File|FileNum|FKey|FP|FreeSp|Inf|Int|IP|KLn|KPs|KRec|Len|Line|Lines|LineSPP|Log|LRec|Mat2Str|Max|Min|Mod|Msg|MsgBox|NewPage|Next|NxtCol|Nxtfld|NxtRow|Ord|Pi|Pos|Printer_List|ProcIn|Rec|Rem|RLn|Rnd|Round|Serial|SetEnv|Sgn|Sin|Sleep|Sqr|Srch|Str2Mat|Sum|Tab|Tan|Timer|UDim|Val|Version)$/i,
    /^(BR_FileName\$|BRErr\$|CForm\$|Chr\$|Cnvrt\$|Date\$|Decrypt\$|Encrypt\$|Env\$|File\$|Help\$|Hex\$|KStat\$|Login_Name\$|LPad\$|LTrm\$|Lwrc\$|Max\$|Min\$|Msg\$|OS_FileName\$|Pic\$|Program\$|RPad\$|Rpt\$|RTrm\$|Session\$|SRep\$|Str\$|Time\$|Trim\$|UnHex\$|UprC\$|UserID\$|Variable\$|WBPlatform\$|WBVersion\$|WSID\$|Xlate\$)$/i,
    /^(if|then|else|end if|for|next|do|while|loop|until|exit do)$/i,
    /^(and|or)$/i,
    /^(ALTERNATE|ATTR|BASE|BORDER|DROP|EVENT|EXTERNAL|FILES|INTERNAL|INVP|KEYED|NATIVE|NOFILES|NOKEY|NONE|OUTIN|OUTPUT|RELATIVE|RELEASE|RESERVE|RESUME|RETAIN|SEARCH|SELECT|SEQUENTIAL|SHIFT|TO|USE|USING)$/i,
    /^(CONV|DUPREC|EOF|EOL|ERROR|IOERR|LOCKED|NOKEY|NOREC|IGNORE|OFLOW|PAGEOFLOW|SOFLOW|ZDIV|TIMEOUT)$/i
  ]

  private isKeyword(match: string): boolean {
    for (const reg of BrSourceDocument.FN_AND_KEYWORDS) {
      if (reg.test(match)){
        return true
      }
    }
    return false
  }

  private static COMMENT_END = /((?=\r?\n)|!:)/g
  private processRegularComment(text: string, index: number): number {
    BrSourceDocument.COMMENT_END.lastIndex = index
    const match = BrSourceDocument.COMMENT_END.exec(text)
    return match?.index || text.length
  }

  private static PARAM_SEARCH = /(?<delimiter>^|;|,) *(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w\[\]]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*/gi
  private parseFunctionFromSource(name: string, match: RegExpMatchArray): UserFunction | undefined {
    if (match.groups){
      const isLib: boolean = match.groups?.isLibrary ? true : false
      const lib: UserFunction = new UserFunction(match.groups.name, isLib)
      
      if (match.groups.params){
        lib.params = []
  
        // remove line continuations
        const params = match.groups.params.replace(BrSourceDocument.LINE_CONTINUATIONS, "")
        const it = params.matchAll(BrSourceDocument.PARAM_SEARCH)
  
        let isOptional = false
        for (const paramMatch of it) {
          if (paramMatch.groups && paramMatch.groups.name){
            
            if (paramMatch.groups.name.trim() === "___"){
              break
            }
  
            if (paramMatch.groups.delimiter ===";"){
              isOptional = true
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
            
            if (this.lastDocComment?.params){
              libParam.documentation = this.lastDocComment.params.get(paramMatch.groups.name)
            }
  
            lib.params.push(libParam)
          }
        }
      }
      if (this.lastDocComment){
        if (this.lastDocComment.text){
          lib.documentation = this.lastDocComment.text
        }
        this.lastDocComment = null
      }
      return lib
    }
  }
}

