"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const lexi_1 = require("./lexi");
function activate(context) {
    console.log('Extension "vslang-br" is now active!');
    (0, lexi_1.activateLexi)(context);
    activateNextPrev(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function activateNextPrev(context) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.nextOccurrence', (editor) => {
        let selectedText;
        let followingText;
        let cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
        if (cursorWordRange !== undefined) {
            editor.selection = new vscode.Selection(cursorWordRange.start, cursorWordRange.end);
        }
        selectedText = editor.document.getText(editor.selection);
        console.log(selectedText);
        followingText = editor.document.getText(editor.selection.with(editor.selection.end, editor.document.lineAt(editor.document.lineCount - 1).range.end));
        let nextMatchIndex = followingText.search(new RegExp(`\\b${selectedText}($|\\b)`));
        if (nextMatchIndex >= 0) {
            let matchOffset = editor.document.offsetAt(editor.selection.end) + nextMatchIndex;
            editor.selection = new vscode.Selection(editor.document.positionAt(matchOffset), editor.document.positionAt(matchOffset + selectedText.length));
            console.log(matchOffset);
        }
        // vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch')
        // editor.selection = new vscode.Selection(0,0,0,3);
        // vscode.commands.executeCommand('actions.find')
        // vscode.commands.executeCommand('toggleFindWholeWord')
        // vscode.commands.executeCommand('editor.action.nextMatchFindAction')
        // vscode.commands.executeCommand('toggleFindWholeWord')
        // vscode.commands.executeCommand('closeFindWidget')
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.prevOccurrence', (editor) => {
        vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
        vscode.commands.executeCommand('actions.find');
        vscode.commands.executeCommand('toggleFindWholeWord');
        vscode.commands.executeCommand('editor.action.previousMatchFindAction');
        vscode.commands.executeCommand('toggleFindWholeWord');
        vscode.commands.executeCommand('closeFindWidget');
    }));
}
//# sourceMappingURL=extension.js.map