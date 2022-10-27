import { Hover, MarkdownString, Position, Range, TextDocument } from "vscode"
import { BrFunction, generateFunctionSignature } from "../completions/functions"

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
