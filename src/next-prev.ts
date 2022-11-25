import * as vscode from 'vscode';

const BrWordRegex = /\w+\$?/

export function activateNextPrev(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.nextOccurrence', (editor) => {

		const cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.start, BrWordRegex);
		if (cursorWordRange !== undefined){
			editor.selection = new vscode.Selection(cursorWordRange.start, cursorWordRange.end)
			const selectedText: string = editor.document.getText(editor.selection)
			const followingText: string = editor.document.getText(editor.selection.with(editor.selection.end, editor.document.lineAt(editor.document.lineCount-1).range.end))
			const newSearch = new RegExp(`(?<![\\w])${selectedText.replace("$","\\$")}(?![\\w]|\\$)`, 'i')
			const nextMatchIndex: number = followingText.search(newSearch)
			if (nextMatchIndex >= 0){
				const matchOffset = editor.document.offsetAt(editor.selection.end) + nextMatchIndex
				editor.selection = new vscode.Selection(editor.document.positionAt(matchOffset), editor.document.positionAt(matchOffset+selectedText.length))
			}
			editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default)
		}

	}))

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.prevOccurrence', (editor) => {

		const cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.start, BrWordRegex)

		if (cursorWordRange !== undefined){
			editor.selection = new vscode.Selection(cursorWordRange.start, cursorWordRange.end)
			const selectedText: string = editor.document.getText(editor.selection)
			const precedingText: string = editor.document.getText(new vscode.Range(0,0,editor.selection.start.line,editor.selection.start.character))
			const newSearch = new RegExp(`(?<![\\w])${selectedText.replace("$","\\$")}(?![\\w]|\\$)`, 'gi')

			let precedingMatch: RegExpExecArray | null
			while ((precedingMatch = newSearch.exec(precedingText)) != null){
				editor.selection = new vscode.Selection(editor.document.positionAt(precedingMatch.index), editor.document.positionAt(precedingMatch.index + selectedText.length))
			}

			editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default)
		}

	}))
}

