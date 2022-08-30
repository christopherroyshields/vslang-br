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
        vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
        vscode.commands.executeCommand('actions.find');
        vscode.commands.executeCommand('toggleFindWholeWord');
        vscode.commands.executeCommand('editor.action.nextMatchFindAction');
        vscode.commands.executeCommand('toggleFindWholeWord');
        vscode.commands.executeCommand('closeFindWidget');
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