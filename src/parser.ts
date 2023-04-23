import Parser = require('web-tree-sitter');
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticRelatedInformation, DiagnosticSeverity, ExtensionContext, languages, Location, Position, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { performance } from 'perf_hooks';
import { log } from 'console';
import { Disposable } from 'vscode-languageclient';

export default class BrParser implements Disposable {
	br!: Parser.Language
	parser!: Parser
	trees: Map<string, Parser.Tree> = new Map<string, Parser.Tree>()
	dispose(): void {
		this.trees.forEach(t => t.delete())
	}

	async activate(context: ExtensionContext): Promise<void> {
		await Parser.init();
		this.br = await Parser.Language.load(path.resolve(__dirname, "..", 'tree-sitter-br.wasm'))
		this.parser = new Parser()
		this.parser.setLanguage(this.br)
	}

	getTree(document: TextDocument):  Parser.Tree {
		const startTime = performance.now()
		let tree = this.trees.get(document.uri.toString())
		if (tree){
			return tree
		} else {
			const startTime = performance.now()
			tree = this.parser.parse(document.getText())
			const endTime = performance.now()
			console.log(`Parse: ${endTime - startTime} milliseconds`)
			this.trees.set(document.uri.toString(),tree)
			return tree
		}
	}

	updateTree(document: TextDocument){
		const oldTree = this.trees.get(document.uri.toString())
		const startTime = performance.now()
		this.parser.reset()
		const tree = this.parser.parse(document.getText(),oldTree);
		const endTime = performance.now()
		console.log(`Parse: ${endTime - startTime} milliseconds`)
		this.trees.set(document.uri.toString(), tree)
	}
}
