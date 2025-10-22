import { Position, Range, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import { VariableType } from "../types/VariableType"
import Parser = require("../../vendor/tree-sitter")

export const FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i
export const STRING_OR_COMMENT = /(\/\*[\s\S]*?\*\/|!.*|(?:}}|`)[^`]*?(?:{{|`|$)|"(?:[^"]|"")*("|$)|'(?:[^']|'')*('|$))/g

export function indicesToRange(text: string, startOffset: number, endOffset: number): Range {
	const startLines = text.substring(0, startOffset).split(/\r?\n/)
	const startLine = startLines.length - 1
	const startCol = startLines[startLines.length - 1].length

	const rangeLines = text.substring(startOffset, endOffset).split(/\r?\n/)
	const endLine = startLine + rangeLines.length - 1
	const endCol = rangeLines[rangeLines.length - 1].length

	const range = new Range(startLine, startCol, endLine, endCol)
	return range
}

export function pointToPos(point: Parser.Point): Position {
	return new Position(point.row, point.column)
}

export function nodeRange(node: Parser.SyntaxNode): Range {
	return new Range(node.startPosition.row,node.startPosition.column,node.endPosition.row,node.endPosition.column)
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
		const debounceTime = workspace.getConfiguration('br').get("diagnosticsDelay", 500);
		clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), debounceTime);
  };
}

/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: string): string {
	return value.replace(/[\\{}*+?|^$.[\]()]/g, '\\$&')
}

export function isComment(cursorPosition: Position, doctext: string, doc: TextDocument): boolean {
	let commentMatch: RegExpExecArray | null
	while ((commentMatch = STRING_OR_COMMENT.exec(doctext)) !== null) {
		const startOffset = commentMatch.index
		const endOffset = commentMatch.index + commentMatch[0].length
		if (doc.offsetAt(cursorPosition) < startOffset){
			break
		}
		if (doc.offsetAt(cursorPosition) >= startOffset){
			if (doc.offsetAt(cursorPosition) <= endOffset){
				return true
			}
		}
	}
	return false
}

const CONTAINS_BALANCED_FN = /[a-zA-Z][\w]*\$?(\*\d+)?\([^()]*\)/g
export function stripBalancedFunctions(line: string){
	if (CONTAINS_BALANCED_FN.test(line)){
		line = line.replace(CONTAINS_BALANCED_FN, "")
		line = stripBalancedFunctions(line)
	}
	return line
}

export function getSearchPath(workspaceFolder: WorkspaceFolder): Uri {
	const searchPath: string = workspace.getConfiguration('br', workspaceFolder).get("searchPath", "")
	if (searchPath){
		return Uri.joinPath(workspaceFolder.uri, searchPath.replace("\\","/"))
	} else {
		return workspaceFolder.uri
	}
}

export const TypeLabel = Object.freeze(new Map<VariableType, string>([
  [VariableType.number, "Number"],
  [VariableType.string, "String"],
  [VariableType.numberarray, "Number Array"],
  [VariableType.stringarray, "String Array"]
]))
