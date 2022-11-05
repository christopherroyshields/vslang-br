import { Hover, MarkdownString, Position, Range, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import ConfiguredProject from "../class/ConfiguredProject"
import { generateFunctionSignature } from "../completions/functions"
import BrFunction from "../interface/BrFunction"
import { VariableType } from "../types/VariableType"

export const STRING_LITERALS = /(}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g
export const FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i
export const STRING_OR_COMMENT = /(\/\*[\s\S]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g

export function isComment(cursorPosition: Position, doctext: string, doc: TextDocument): boolean {
	let commentMatch: RegExpExecArray | null
	while ((commentMatch = STRING_OR_COMMENT.exec(doctext)) !== null) {
		let startOffset = commentMatch.index
		let endOffset = commentMatch.index + commentMatch[0].length
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
	const searchPath: string = workspace.getConfiguration('br', workspaceFolder).get("searchPath", "");
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
