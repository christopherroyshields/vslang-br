import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

const LexiPath = path.normalize(__dirname+"\\..\\Lexi")
let autoCompileStatusBarItem: vscode.StatusBarItem;
const AutoCompileState: Map<string, boolean> = new Map(); 

export function activateLexi(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('vslang-br.compile', () => {
		var activeFilename: string | undefined = vscode.window.activeTextEditor?.document.fileName;
		
		if (activeFilename){
			compileBrProgram(activeFilename);
		}
	}));

	const autoCompileCommand = 'vslang-br.toggleAutoCompile';
	autoCompileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	autoCompileStatusBarItem.command = autoCompileCommand;
	autoCompileStatusBarItem.text = 'Auto-Compile Off';
	context.subscriptions.push(autoCompileStatusBarItem);

	let editor = vscode.window.activeTextEditor;
	if (editor && editor.document.languageId === "br"){
		autoCompileStatusBarItem.show();
	}

	context.subscriptions.push(vscode.commands.registerCommand(
		autoCompileCommand,
		() => {
			toggleAutoCompile();
		}
	))

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === 'br') {
			autoCompileStatusBarItem.show();
		} else {
			autoCompileStatusBarItem.hide();
		}
	}))

	vscode.workspace.onDidSaveTextDocument((document) => {
		if (AutoCompileState.get(document.fileName)){
			compileBrProgram(document.fileName);
		}
	}, context.subscriptions)

}

function compileBrProgram(activeFilename: string) {
	exec(`${LexiPath}\\ConvStoO.cmd ${activeFilename}`, {
		cwd: `${LexiPath}`
	});
}

function toggleAutoCompile() {
	var editor = vscode.window.activeTextEditor;
	if (editor) {
		if (AutoCompileState.get(editor.document.fileName) === undefined){
			AutoCompileState.set(editor.document.fileName, true);
			autoCompileStatusBarItem.text = "Auto-Compile On";
		} else {
			AutoCompileState.set(editor.document.fileName, !AutoCompileState.get(editor.document.fileName));
			autoCompileStatusBarItem.text = AutoCompileState.get(editor.document.fileName) ? "Auto-Compile On" : "Auto-Compile Off";
		}
	}
}

