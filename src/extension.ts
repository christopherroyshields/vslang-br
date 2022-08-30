import * as vscode from 'vscode';
import { exec } from "child_process";
import * as path from 'path';
import { activateLexi } from './lexi';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Extension "vslang-br" is now active!');

	activateLexi(context);

	activateNextPrev(context);
}

export function deactivate() {}

function activateNextPrev(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.nextOccurrence', (editor) => {
		vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch')
		vscode.commands.executeCommand('actions.find')
		vscode.commands.executeCommand('toggleFindWholeWord')
		vscode.commands.executeCommand('editor.action.nextMatchFindAction')
		vscode.commands.executeCommand('toggleFindWholeWord')
		vscode.commands.executeCommand('closeFindWidget')
  }))

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.prevOccurrence', (editor) => {
		vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch')
		vscode.commands.executeCommand('actions.find')
		vscode.commands.executeCommand('toggleFindWholeWord')
		vscode.commands.executeCommand('editor.action.previousMatchFindAction')
		vscode.commands.executeCommand('toggleFindWholeWord')
		vscode.commands.executeCommand('closeFindWidget')
  }))
}

