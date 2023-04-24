import Parser = require('web-tree-sitter');
import path = require('path');
import { ExtensionContext, Position, Range, TextDocument} from 'vscode';
import { performance } from 'perf_hooks';
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
		const startTime = performance.now()
		const tree = this.parser.parse(document.getText());
		const endTime = performance.now()
		console.log(`Parse: ${endTime - startTime} milliseconds`)

		this.trees.set(document.uri.toString(), tree)
	}

	getOccurences(word: string, document: TextDocument, range: Range): Range[] {
		const occurrences: Range[] = []
		
		const tree = this.getTree(document)
		const node = tree.rootNode.descendantForPosition(this.getPoint(range.start))

		const name_match = word.replace(/\w/g, c => {
			return `[${c.toUpperCase()}${c.toLowerCase()}]`
		}).replace("$","\\\\$")

		const query = `(${node.parent?.type} name: (_) @occurrence
		(#match? @occurrence "^${name_match}$"))`
		
		const results = this.br.query(query).matches(tree.rootNode)
	
		results.forEach(r => {
			occurrences.push(this.getNodeRange(r.captures[0].node))
		});

		return occurrences
	}

	getNodeRange(node: Parser.SyntaxNode){
		return new Range(new Position(node.startPosition.row,node.startPosition.column),new Position(node.endPosition.row,node.endPosition.column))
	}

	getPoint(range: Position): Parser.Point {
		return {
			row: range.line,
			column: range.character
		}
	}
}
