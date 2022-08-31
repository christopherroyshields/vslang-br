"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateNextPrev = void 0;
const vscode = require("vscode");
const BrWordRegex = /\w+\$?/;
function activateNextPrev(context) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.nextOccurrence', (editor) => {
        const cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.start, BrWordRegex);
        if (cursorWordRange !== undefined) {
            editor.selection = new vscode.Selection(cursorWordRange.start, cursorWordRange.end);
            const selectedText = editor.document.getText(editor.selection);
            const followingText = editor.document.getText(editor.selection.with(editor.selection.end, editor.document.lineAt(editor.document.lineCount - 1).range.end));
            const newSearch = new RegExp(`(?<![\\w])${selectedText.replace("$", "\\$")}(?![\\w]|\\$)`, 'i');
            const nextMatchIndex = followingText.search(newSearch);
            if (nextMatchIndex >= 0) {
                let matchOffset = editor.document.offsetAt(editor.selection.end) + nextMatchIndex;
                editor.selection = new vscode.Selection(editor.document.positionAt(matchOffset), editor.document.positionAt(matchOffset + selectedText.length));
            }
            editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
        }
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.prevOccurrence', (editor) => {
        const cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.start, BrWordRegex);
        if (cursorWordRange !== undefined) {
            editor.selection = new vscode.Selection(cursorWordRange.start, cursorWordRange.end);
            const selectedText = editor.document.getText(editor.selection);
            const precedingText = editor.document.getText(new vscode.Range(0, 0, editor.selection.start.line, editor.selection.start.character));
            const newSearch = new RegExp(`(?<![\\w])${selectedText.replace("$", "\\$")}(?![\\w]|\\$)`, 'gi');
            let precedingMatch;
            while ((precedingMatch = newSearch.exec(precedingText)) != null) {
                editor.selection = new vscode.Selection(editor.document.positionAt(precedingMatch.index), editor.document.positionAt(precedingMatch.index + selectedText.length));
            }
            editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
        }
    }));
}
exports.activateNextPrev = activateNextPrev;
//# sourceMappingURL=next-prev.js.map