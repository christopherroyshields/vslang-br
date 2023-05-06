import { VariableType } from "../types/VariableType"
import DocComment from "./DocComment"
import UserFunction from "./UserFunction"
import UserFunctionParameter from "./UserFunctionParameter"
import { BrVariable } from "./BrVariable"
import { LineLabel } from "./LineLabel"
import { RegExpExecArrayWithIndices } from "../providers/RegExpMatchArrayWithIndices"
import { Range } from "vscode"
import { indicesToRange } from "../util/common"

type DimVariable = {
  name: string,
  type: VariableType
  position: {
    start: number,
    end: number
  }
}

type FunctionKey = {
  isLibrary: boolean,
  name: string
}

export default class BrSourceDocument {
	functions: FunctionKey[] = []
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
  static SKIP_OR_WORD = /((?<skippable>\/\*[\s\S]*?\*\/|!:|!_.*\r?\n|!.*|(?:}}|`)[^`]*?(?:{{|`|$)|"(?:[^"]|"")*("|$)|'(?:[^']|'')*('|$))|(mat +)?[a-z_]\w*\$?|(?<end>\r?\n|$))/gi
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
        const indices: [number,number] = [matchEnd - validLineStart.groups?.labelName.length, matchEnd]
        this.processLabel(validLineStart.groups.labelName, indices)
      }

      let skipOrWord: RegExpExecArrayWithIndices | null
      while ((skipOrWord = BrSourceDocument.SKIP_OR_WORD.exec(text) as RegExpExecArrayWithIndices) !== null) {
        if (skipOrWord.groups?.end !== undefined){
          matchEnd = skipOrWord.index
          break
        }
        if (skipOrWord.groups?.skippable){
          if (skipOrWord[0].substring(0,3)==="/**"){
            matchEnd = skipOrWord.index 
            this.processDocComment(skipOrWord[0], skipOrWord.index)
          }
          if (skipOrWord.groups.skippable==="!:"){
            lineStart = true
            matchEnd += 2
          } else if (skipOrWord[0].substring(0,2)==="!_"){
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
          } else if (skipOrWord[0].substring(0,1)==="!"){
            matchEnd = this.processRegularComment(text, skipOrWord.index)
            break
          } else {
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
          }
        } else {
          if (lineStart){
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
            this.processStatement(skipOrWord[0], text, skipOrWord.index)
            lineStart = false
          } else {
            matchEnd = BrSourceDocument.SKIP_OR_WORD.lastIndex
            // matchEnd = this.processWord(skipOrWord[0], text, skipOrWord.index)
            // if (skipOrWord[0].toLowerCase()==="then" || skipOrWord[0].toLowerCase()==="else"){
            //   lineStart = true
            // }
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

  private processLabel(name: string, indices: [number,number]) {
    this.labels.push({
      name: name,
      offset: {
        start: indices[0],
        end: indices[1]
      }
    })
  }

  private processStatement(statement: string, text: string, index: number) {
    if (statement.toLowerCase()==="dim"){
      return this.processDim(text, index+3)
    }
    if (statement.toLowerCase()==="def"){
      return this.processFunction(text, index)
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

  private static DEF_FN = /def\s+(?:(?<isLibrary>lib\w*)\s+)?(?<name>\w*\$?).*/gi
  private processFunction(text: string, index: number): number {
    BrSourceDocument.DEF_FN.lastIndex = index
    const match = BrSourceDocument.DEF_FN.exec(text)
    if (match?.groups?.name){
      this.functions.push({
        isLibrary: match?.groups?.isLibrary ? true : false,
        name: match.groups.name
      })
      return BrSourceDocument.DEF_FN.lastIndex
    } else {
      return index + 3
    }
  }

  private static COMMENT_END = /((?=\r?\n)|!:)/g
  private processRegularComment(text: string, index: number): number {
    BrSourceDocument.COMMENT_END.lastIndex = index
    const match = BrSourceDocument.COMMENT_END.exec(text)
    return match?.index || text.length
  }
}