import * as vscode from 'vscode';
import { exec } from "child_process";
import * as path from 'path';
import { activateLexi } from './lexi';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Extension "vslang-br" is now active!');

	activateLexi(context);
}

export function deactivate() {}

