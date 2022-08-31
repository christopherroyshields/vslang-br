import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Extension "vslang-br" is now active!');

	activateLexi(context);

	activateNextPrev(context);
}

export function deactivate() {}
