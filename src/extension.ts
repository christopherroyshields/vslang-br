import { ExtensionContext, languages } from 'vscode';
import { activateLexi } from './lexi';
import { activateNextPrev } from './next-prev';
import { activateClient, deactivateClient } from './client'
import LayoutSemanticTokenProvider, { LayoutLegend } from './providers/LayoutSemanticTokenProvider';

export async function activate(context: ExtensionContext) {
	const subscriptions = context.subscriptions
	
	activateLexi(context)

	activateNextPrev(context)

	const layoutSemanticTokenProvider = new LayoutSemanticTokenProvider()

	subscriptions.push(languages.registerDocumentSemanticTokensProvider({
		language: "lay",
		scheme: "file"
	}, layoutSemanticTokenProvider, LayoutLegend))
	
	activateClient(context)
}

export function deactivate() {
	deactivateClient();
}
