import { VariableType } from "../types/VariableType"
import DocComment from "./DocComment"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"
import { BrVariable } from "./BrVariable"
import { LineLabel } from "./LineLabel"
import { RegExpExecArrayWithIndices } from "../providers/RegExpMatchArrayWithIndices"

type DimVariable = {
  name: string,
  type: VariableType
  position: {
    start: number,
    end: number
  }
}

enum ExpressionType {
  String,
  Numeric,
  StringArray,
  NumberArray,
  Empty
}

type Expression = {
  type?: ExpressionType,
  pos: [number, number]
}

interface ReferenceMatch {
  groups: {
    name: string,
    isArray: string | undefined,
    isString: string | undefined,
    hasParams: string | undefined
  },
  indices: {
    groups: {
      name: [number, number] | undefined,
      isArray: [number, number] | undefined,
      isString: [number, number] | undefined,
      hasParams: [number, number] | undefined
    }
  }
}

type ReferenceRange = Expression[]

export default class BrSourceDocument {
	functions: UserFunction[] = []
  variables = new Map<string,BrVariable>()
  labels: LineLabel[] = []
  lastDocComment: DocComment | null = null
  static LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g
  dims: DimVariable[] = []
	constructor(text = "") {
    if (text){
      this.parse(text)
    }
	}

  static VALID_LINE = /(?<=(?:^|\n))(?: *\d+ +)?(?: *(?<labelName>\w+:))?(?= *\S)/gd
  static SKIP_OR_WORD = /((?<skippable>(?<docComment>\/\*\*[\s\S]+?\*\/)|\/\*[\s\S]*?\*\/|!:|!_.*\r?\n|!.*|(?:}}|`)[^`]*?(?:{{|`|$)|"(?:[^"]|"")*("|$)|'(?:[^']|'')*('|$))|(?<reference>(?<isArray>mat *)?(?<name>\w+(?<isString>\$)?)(?<hasParams> *\()?)|(?<end>\r?\n|$))/gid
  private parse(text: string){
    text = text.replace("\t"," ")
    let validLineStart
    let lineCount = 0
    while ((validLineStart = BrSourceDocument.VALID_LINE.exec(text) as RegExpExecArrayWithIndices) !== null) {
      lineCount+=1
      let lineStart = true
      let matchEnd = BrSourceDocument.VALID_LINE.lastIndex
      BrSourceDocument.SKIP_OR_WORD.lastIndex = matchEnd

      if (validLineStart.groups?.labelName){
        this.processLabel(validLineStart.groups.labelName, validLineStart.indices.groups.labelName)
      }

      let skipOrWord: RegExpExecArrayWithIndices | null
      while ((skipOrWord = BrSourceDocument.SKIP_OR_WORD.exec(text) as RegExpExecArrayWithIndices) !== null) {
        if (skipOrWord.groups?.end !== undefined){
          matchEnd = skipOrWord.index
          break
        }
        if (skipOrWord.groups?.skippable){
          const skippable = skipOrWord.groups.skippable
          if (skipOrWord.groups.docComment){
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
            this.processDocComment(skipOrWord.groups.skippable)
          } else if (skipOrWord.groups.skippable==="!:"){
            lineStart = true
            matchEnd += 2
          } else if (skippable.substring(0,2)==="!_"){
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
          } else if (skippable.substring(0,1)==="!"){
            matchEnd = this.processRegularComment(text, skipOrWord.index)
            break
          } else {
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
          }
        } else if (skipOrWord.groups?.reference){
          const word = skipOrWord.groups.name
          if (lineStart && this.isStatement(word)){
            matchEnd = this.processStatement(word, text, skipOrWord.index)
            lineStart = false
          } else {
            const indices = skipOrWord.indices.groups
            if (this.isKeyword(word)){
              matchEnd = indices.reference[1]
              if (word==="then" || word==="else"){
                lineStart = true
              }
            } else {
              matchEnd = this.parseReference(skipOrWord, indices, text)
            }
          }
        }
        BrSourceDocument.SKIP_OR_WORD.lastIndex = matchEnd
      }
      BrSourceDocument.VALID_LINE.lastIndex = matchEnd
    }
  }

  private static STATEMENT_TEST = /^(mat|chain|close|continue|data|def|delete|dim|display|end|end def|execute|exit|fields|fnend|form|gosub|goto|input|key|let|library|linput|menu|menu text|menu data|menu status|on error|on fkey|on|open|option|pause|print|using|border|randomize|read|reread|restore|retry|return|rewrite|rinput|scr_freeze|scr_thaw|select|stop|write|trace|use)$/
  private isStatement(word: string): boolean {
    return BrSourceDocument.STATEMENT_TEST.test(word.toLowerCase())
  }
  
  private processDocComment(text: string): void {
    this.lastDocComment = DocComment.parse(text)
  }

  private processLabel(name: string, indices: [number,number]) {
    this.labels.push({
      name: name,
      offset: {
        start: indices[0],
        end: indices[1]
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
  
  private processStatement(statement: string, text: string, index: number): number {
    switch (statement) {
      case "dim":
        return this.processDim(text, index+3)
      case "def":
        return this.processFunction(text, index)
      case "form":
        return this.processFormStatement(text, index+4)
      case "print":
        return this.parsePrint(text, index)
      default:
        return index + statement.length
    }
  }
  
  private static DIM_VAR = /(?:(?<name>[a-zA-Z]\w*(?<isString>\$)?)(?<isArray> *\()?|(?<end>\r?\n|$))/gd
  private processDim(text: string, index: number): number {
    BrSourceDocument.DIM_VAR.lastIndex = index
    let match: RegExpExecArray | null
    let end = index
    while ((match = BrSourceDocument.DIM_VAR.exec(text)) !== null) {
      if (match?.groups?.end !== undefined){
        end = match.index
        break
      } else {
        let varType: VariableType
        if (match.groups?.isArray){
          if (match.groups.isString){
            varType = VariableType.stringarray
          } else {
            varType = VariableType.numberarray
          }
        } else {
          if (match.groups?.isString){
            varType = VariableType.string
          } else {
            varType = VariableType.number
          }
        }
        let name = ""
        if (match.groups?.name){
          name = match.groups?.name
        }
        const dim: DimVariable = {
          name: name,
          type: varType,
          position: {
            start: match.index,
            end: match.index + name.length
          }
        }
        
        this.dims.push(dim)
      }
    }
    return end
  }

  private static FORM_VAR_OR_END = /(?:(?<skippable>\/\*[\s\S]*?\*\/|!.*|(?:}}|`)[^`]*?(?:{{|`|$)|"(?:[^"]|"")*("|$)|'(?:[^']|'')*('|$))|(?<pic>pic\(.*?\))|(?<var>[a-z][\w\d]*) *\*|(?<=\b[a-z]+\s+)(?<lenvar>[a-z_]\w+\b)|(?<end>\r?\n|$|!))/gi
  private processFormStatement(text: string, index: number): number {
    BrSourceDocument.FORM_VAR_OR_END.lastIndex = index
    let match: RegExpExecArray | null
    let end = index
    while ((match = BrSourceDocument.FORM_VAR_OR_END.exec(text)) !== null) {
      if (match?.groups?.skippable || match?.groups?.pic){
        end = BrSourceDocument.FORM_VAR_OR_END.lastIndex
      } else if (match?.groups?.end !== undefined){
        end = match.index
        break
      } else if (match?.groups?.lenvar){
        this.variables.set(match.groups.lenvar.toLocaleLowerCase(), {
          name: match.groups.lenvar,
          type: VariableType.number
        })
      }else if (match?.groups?.var){
        this.variables.set(match.groups.var.toLocaleLowerCase(), {
          name: match.groups.var,
          type: VariableType.number
        })
      }
    }
    return end
  }

  private static DEF_FN = /def\s+(?:(?<isLibrary>lib\w*)\s+)?(?<name>\w*\$?) *(\* *\d+ *)?(?:\((?<params>[!&\w$, ;*\r\n\t@[\]]+)\))?(?<fnBody>\s*=.*|[\s\S]*?(fnend|end def))/gi
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

  private static PRINT_CHANNEL = /(?:(?<filenum> +#)|(?<using> +using)|)/gid
  private parsePrint(text: string, index: number): number {
    BrSourceDocument.PRINT_CHANNEL.lastIndex = index + 5
    const match = BrSourceDocument.PRINT_CHANNEL.exec(text) as RegExpExecArrayWithIndices
    if (match.groups){
      if (match.groups.filenum){
        const filenumExpression = this.parseExpression(text, match.indices.groups.filenum[1])
        index = filenumExpression.pos[1]
      } else if (match.groups.using){
        const filenumExpression = this.parseExpression(text, match.indices.groups.using[1])
        index = filenumExpression.pos[1]
      }
    }
    return BrSourceDocument.PRINT_CHANNEL.lastIndex
  }

  private static EXPRESSION_ELEMENT = /(?: *(?:(?<string>(}}|`)[^`]*?(?:{{|`)|"(?:[^"]|"")*"|'(?:[^']|'')*')|(?<number>[\d.]+)|(?<reference>(?<isArray>mat *)?(?<name>\w+(?<isString>\$)?)(?<hasParams> *\()?)|(?<operator><|>|<>|<=|>=|~=|==|:=|\+=|-=|\*=|\/=|=|\+|-|\*|\/|&)|(?<expression>\())|(?<end>))/gid
  private parseExpression(text: string, index: number): Expression {
    const expression: Expression = {
      pos: [index, index]
    }

    BrSourceDocument.EXPRESSION_ELEMENT.lastIndex = index
    let match: RegExpExecArrayWithIndices | null
    while ((match = BrSourceDocument.EXPRESSION_ELEMENT.exec(text) as RegExpExecArrayWithIndices) !== null) {
      if (match.groups){
        const indices = match.indices.groups
        if (indices.end !== undefined){
          expression.type ??= ExpressionType.Empty
          expression.pos[1] = indices.end[1]
          break
        }
        if (indices.string){
          expression.type ??= ExpressionType.String
          expression.pos[1] = indices.string[1]
        }
        if (indices.number){
          expression.type ??= ExpressionType.Numeric
          expression.pos[1] = indices.number[1]
        }
        if (indices.operator){
          expression.type ??= ExpressionType.Numeric
          expression.pos[1] = indices.operator[1]
        }
        if (indices.expression){
          const subExpression = this.parseSubExpression(text, indices.expression[1])
          expression.type ??= subExpression.type
          expression.pos[1] = subExpression.pos[1]
          BrSourceDocument.EXPRESSION_ELEMENT.lastIndex = subExpression.pos[1]
        }

        if (indices.reference){
          BrSourceDocument.EXPRESSION_ELEMENT.lastIndex = this.parseReference(match, indices, text)
        }
      }
    }

    return expression
  }

  private parseReference(match: RegExpExecArrayWithIndices, indices: { [key: string]: [number, number] }, text: string): number {
    let index = indices.reference[1]
    if (match.groups){
      if (this.isFunction(match.groups.name)) {
        if (indices.hasParams) {
          index = this.parseFunctionParams(text, indices.reference[1])
        }
      } else {
        const isString: boolean = (match.groups.isString !== undefined)
        const isArray: boolean = (match.groups.isArray !== undefined)
        const refName = match.groups.name
        if (indices.hasParams) {
          index = this.parseReferenceWithRange(refName, isArray, isString, text, indices.reference[1])
        } else {
          this.variables.set(refName.toLowerCase(), {
            name: refName,
            type: BrSourceDocument.GetVarType(isString, isArray)
          })
        }
      }
    }
    return index
  }

  private static GetVarType(isString: boolean, isArray: boolean): VariableType {
    if (isArray){
      return isString ? VariableType.stringarray : VariableType.numberarray
    } else {
      return isString ? VariableType.string : VariableType.number
    }
  }

  private static RANGE_SEP = / *(?:(?<sep>:)|(?<end>\)|))/gd
  parseReferenceWithRange(name: string, isArray: boolean, isString: boolean, text: string, index: number): number {
    const refRange: ReferenceRange = []
    const param = this.parseExpression(text, index)
    refRange.push(param)
    let end = param.pos[1]
    let match: RegExpExecArrayWithIndices | null
    BrSourceDocument.RANGE_SEP.lastIndex = param.pos[1]
    while ((match = BrSourceDocument.RANGE_SEP.exec(text) as RegExpExecArrayWithIndices) !== null){
      if (match.groups){
        const indices = match.indices.groups
        if (indices.end){
          end = indices.end[1]
          break
        }
        if (indices.sep){
          const param = this.parseExpression(text, indices.sep[1])
          refRange.push(param)
          BrSourceDocument.RANGE_SEP.lastIndex = param.pos[1]
        }
      }
    }

    // if only only one paramter than treat as array element
    if (refRange.length === 1){
      isArray = true
    }

    this.variables.set(name.toLowerCase(), {
      name: name,
      type: BrSourceDocument.GetVarType(isString, isArray)
    })

    return end
  }

  private static PARAM_SEP = / *(?:(?<sep>,)|(?<end>\)|))/gd
  parseFunctionParams(text: string, index: number): number {
    const param = this.parseExpression(text, index)
    let end = param.pos[1]
    let match: RegExpExecArrayWithIndices | null
    BrSourceDocument.PARAM_SEP.lastIndex = param.pos[1]
    while ((match = BrSourceDocument.PARAM_SEP.exec(text) as RegExpExecArrayWithIndices) !== null){
      if (match.groups){
        const indices = match.indices.groups
        if (indices.end){
          end = indices.end[1]
          break
        }
        if (indices.sep){
          const param = this.parseExpression(text, indices.sep[1])
          BrSourceDocument.PARAM_SEP.lastIndex = param.pos[1]
        }
      }
    }
    return end
  }

  private static FN_LIST = [
    /^(Abs|AIdx|Atn|Bell|Ceil|CmdKey|Cnt|Code|CoS|CurCol|CurFld|CurPos|CurRow|CurTab|CurWindow|Date|Days|Debug_Str|DIdx|Err|Exists|Exp|File|FileNum|FKey|FP|FreeSp|Inf|Int|IP|KLn|KPs|KRec|Len|Line|Lines|LineSPP|Log|LRec|Mat2Str|Max|Min|Mod|Msg|MsgBox|NewPage|Next|NxtCol|Nxtfld|NxtRow|Ord|Pi|Pos|Printer_List|ProcIn|Rec|Rem|RLn|Rnd|Round|Serial|SetEnv|Sgn|Sin|Sleep|Sqr|Srch|Str2Mat|Sum|Tab|Tan|Timer|UDim|Val|Version)$/i,
    /^(BR_FileName\$|BRErr\$|CForm\$|Chr\$|Cnvrt\$|Date\$|Decrypt\$|Encrypt\$|Env\$|File\$|Help\$|Hex\$|KStat\$|Login_Name\$|LPad\$|LTrm\$|Lwrc\$|Max\$|Min\$|Msg\$|OS_FileName\$|Pic\$|Program\$|RPad\$|Rpt\$|RTrm\$|Session\$|SRep\$|Str\$|Time\$|Trim\$|UnHex\$|UprC\$|UserID\$|Variable\$|WBPlatform\$|WBVersion\$|WSID\$|Xlate\$)$/i,
  ]

  isFunction(name: string): boolean {
    if (name.substring(0,1)==="fn"){
      return true
    }
    for (const reg of BrSourceDocument.FN_LIST) {
      if (reg.test(name)){
        return true
      }
    }
    return false
  }
  
  private static CLOSE_PAREN = /( *(?<closed>\))|)/gd
  parseSubExpression(text: string, index: number): Expression {
    const subExpression = this.parseExpression(text, index)
    BrSourceDocument.CLOSE_PAREN.lastIndex = subExpression.pos[1]
    const closeMatch = BrSourceDocument.CLOSE_PAREN.exec(text) as RegExpExecArrayWithIndices
    if (closeMatch.groups?.closed){
      subExpression.pos[1] = BrSourceDocument.CLOSE_PAREN.lastIndex
    }
    subExpression.pos[0]=index
    return subExpression
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
    /^(if|then|else|end if|for|next|do|while|loop|until|exit do)$/,
    /^(and|or)$/,
    /^(alternateattr|base|border|drop|event|external|files|fields|goto|gosub|internal|invp|keyed|native|nofiles|nokey|none|outin|output|relative|release|reserve|resume|retain|search|select|sequential|shift|to|use|using)$/,
    /^(conv|duprec|eof|eol|error|ioerr|locked|nokey|norec|ignore|oflow|pageoflow|soflow|zdiv|timeout|wait)$/
  ]

  private isKeyword(word: string): boolean {
    for (const reg of BrSourceDocument.FN_AND_KEYWORDS) {
      if (reg.test(word)){
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

  private static PARAM_SEARCH = /(?<delimiter>^|;|,) *(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w[\]]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*/gi
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

