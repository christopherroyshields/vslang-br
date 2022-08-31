import * as vscode from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Extension "vslang-br" is now active!');

	activateLexi(context);

	activateNextPrev(context);

	activateClient(context);
}

export function deactivate() {
	deactivateClient();
}