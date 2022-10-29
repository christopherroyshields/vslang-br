import { Hover, MarkdownString, Position, Range, TextDocument, Uri, WorkspaceFolder } from "vscode"
import { ConfiguredProject } from "../class/ConfiguredProject"
import { generateFunctionSignature } from "../completions/functions"
import { BrFunction } from "../interface/BrFunction"

export function isComment(cursorPosition: Position, doctext: string, doc: TextDocument): boolean {
	let commentMatch: RegExpExecArray | null
	const STRING_OR_COMMENT = /(\/\*[\s\S]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g
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

export function createHoverFromFunction(fn: BrFunction): Hover {

	let markDownString = '```br\n' + fn.name + generateFunctionSignature(fn) + '\n```\n---'

	if (markDownString){
		markDownString += '\n' + fn.documentation
	}

	fn.params?.forEach((param)=>{
		if (param.documentation){
			markDownString += `\r\n * @param \`${param.name}\` ${param.documentation}`
		}
	})

	let markup = new MarkdownString(markDownString)

	return new Hover(markup)
}

const CONTAINS_BALANCED_FN = /[a-zA-Z][\w]*\$?(\*\d+)?\([^()]*\)/g
export function stripBalancedFunctions(line: string){
	if (CONTAINS_BALANCED_FN.test(line)){
		line = line.replace(CONTAINS_BALANCED_FN, "")
		line = stripBalancedFunctions(line)
	}
	return line
}

export function getSearchPath(workspaceFolder: WorkspaceFolder, project: ConfiguredProject): Uri {
	const config = project.config
	const searchPath = workspaceFolder.uri;
	if (config !== undefined && config.searchPath !== undefined){
		return Uri.joinPath(searchPath, config.searchPath.replace("\\","/"))
	} else {
		return workspaceFolder.uri
	}
}


