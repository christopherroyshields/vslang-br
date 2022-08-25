import * as vscode from 'vscode';
import { exec } from "child_process";
import * as path from 'path';

const LexiPath = path.normalize(__dirname+"\\..\\Lexi")

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Extension "vslang-br" is now active!');

	let disposable = vscode.commands.registerCommand('vslang-br.compile', () => {
		var activeFilename: string | undefined = vscode.window.activeTextEditor?.document.fileName;
		
		if (activeFilename){
			exec(`${LexiPath}\\ConvStoO.cmd ${activeFilename}`, {
				cwd: `${LexiPath}`
			});
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
