import Parser = require('web-tree-sitter');
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, ExtensionContext, Position, Range, TextDocument, TextDocumentChangeEvent, Uri, workspace} from 'vscode';
import { performance } from 'perf_hooks';
import { Disposable } from 'vscode-languageclient';
import { EOL } from 'os';

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

		context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
			const document  = e.document;
			if (document.languageId === "br"){
				this.updateTree(e);
			}
		}))
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

	updateTree(e: TextDocumentChangeEvent){
		const document = e.document
		const oldTree = this.trees.get(document.uri.toString())
		if (oldTree){
			for (const change of e.contentChanges) {
				

				const newLines = change.text.split(EOL)
				const newRow = change.range.start.line + (newLines.length - 1)

				const endPos: Parser.Point = {
					row: newRow,
					column: 0
				}

				if (newRow === change.range.start.line){
					endPos.column = change.range.start.character + newLines[0].length
				} else {
					endPos.column = change.range.start.character + newLines[newLines.length - 1].length
				}

				const edit: Parser.Edit = {
					startIndex: change.rangeOffset,
					oldEndIndex: change.rangeOffset + change.rangeLength,
					newEndIndex: change.rangeOffset + change.text.length,
					startPosition: {
						row: change.range.start.line,
						column: change.range.start.character
					},
					oldEndPosition: {
						row: change.range.end.line,
						column: change.range.end.character
					},
					newEndPosition: endPos
				}

				oldTree.edit(edit)
			}

			const startTime = performance.now()
			const tree = this.parser.parse(document.getText(), oldTree);
			const endTime = performance.now()
			console.log(`REPARSE: ${endTime - startTime} milliseconds`)
			this.trees.set(document.uri.toString(), tree)
		} else {
			const startTime = performance.now()
			const tree = this.parser.parse(document.getText());
			const endTime = performance.now()
			console.log(`Parse: ${endTime - startTime} milliseconds`)
			this.trees.set(document.uri.toString(), tree)
		}
	}

	async getErrors(uri: Uri, document: string): Promise<Diagnostic[]> {
		const errorQuery = this.br.query('(ERROR) @error')
		const tree = this.parser.parse(document)
		const errors = errorQuery.matches(tree.rootNode);
		const diagnostics: Diagnostic[] = []
		// collection.clear();
		for (const error of errors) {
			for (const capture of error.captures) {
				diagnostics.push({
					code: '',
					message: 'Syntax error',
					range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
					severity: DiagnosticSeverity.Error,
					source: 'BR Syntax Scanner'
				})
			}
		}
		tree.delete()
		return diagnostics
	}

	getOccurences(word: string, document: TextDocument, range: Range): Range[] {
		const occurrences: Range[] = []
		
		const tree = this.getTree(document)
		const node = tree.rootNode.descendantForPosition(this.getPoint(range.start))

		const name_match = word.replace(/\w/g, c => {
			return `[${c.toUpperCase()}${c.toLowerCase()}]`
		}).replace("$","\\\\$")

		let selector = ""
		if (node.type==="function_name"){
			selector = `(function_name) @occurrence`
		} else {
			selector = `${node.parent?.type} name: (_) @occurrence`
		}

		const predicate = `(#match? @occurrence "^${name_match}$")`
		const query = `(${selector} ${predicate})`
		
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

	getDiagnostics(document: TextDocument): Diagnostic[] {

		const errorQuery = this.br.query('(ERROR) @error')
		const tree = this.getTree(document)
		const errors = errorQuery.matches(tree.rootNode);
		const diagnostics: Diagnostic[] = []
		// collection.clear();
		for (const error of errors) {
			for (const capture of error.captures) {
				diagnostics.push({
					code: '',
					message: 'Syntax error',
					range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
					severity: DiagnosticSeverity.Error,
					source: 'BR Syntax Scanner',
					// relatedInformation: [
					//   new DiagnosticRelatedInformation(new Location(document.uri, new Range(new Position(1, 8), new Position(1, 9))), 'first assignment to `x`')
					// ]
				})
			}
		}
		return diagnostics
	}
}
