"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const path = require("path");
const LexiPath = path.normalize(__dirname + "\\..\\Lexi");
function activate(context) {
    console.log('Extension "vslang-br" is now active!');
    let disposable = vscode.commands.registerCommand('vslang-br.compile', () => {
        var activeFilename = vscode.window.activeTextEditor?.document.fileName;
        if (activeFilename) {
            (0, child_process_1.exec)(`${LexiPath}\\ConvStoO.cmd ${activeFilename}`, {
                cwd: `${LexiPath}`
            });
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map