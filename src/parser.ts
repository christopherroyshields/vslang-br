import Parser = require('web-tree-sitter');
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, ExtensionContext, Position, Range, TextDocument, TextDocumentChangeEvent, Uri, workspace} from 'vscode';
import { performance } from 'perf_hooks';
import { Disposable } from 'vscode-languageclient';
import { EOL } from 'os';
import * as fs from 'fs';
const fnQuery = fs.readFileSync(path.join(__dirname,"..","tree-query","function_def.scm")).toString()

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

	filterOccurrences(node: Parser.SyntaxNode,  tree: Parser.Tree, occurrences: Parser.QueryMatch[]): Parser.QueryMatch[]{
		// get function ranges
		const fnRanges: {
			node: Parser.SyntaxNode;
			start: number;
			end: number;
		}[] = this.getFunctionRanges(tree)

		// if selection is in function and is param
		const fn: { node: Parser.SyntaxNode, endIndex: number } | null = this.inFunction(node, fnRanges)
		if (fn && this.isParamOfFunction(node, fn.node)) {
			// deselect all occurrences not in function
			occurrences = occurrences.filter((match)  => {
				const occurrence = match.captures[0].node
				if (occurrence.startIndex > fn.node.startIndex && occurrence.startIndex < fn.endIndex){
					return true
				} else {
					return false
				}
			})
		} else {
			// select all occurrences that are not params
			occurrences = occurrences.filter((match)  => {

				const occurrence = match.captures[0].node

				const occurenceFn = this.inFunction(occurrence, fnRanges)
				if (occurenceFn && this.isParamOfFunction(occurrence, occurenceFn.node)){
					return false
				} else {
					return true
				}
			})
		}

		return occurrences
	}

	match(query: string, tree: Parser.SyntaxNode): Parser.QueryMatch[] {
		const startTime = performance.now()
		const parserQuery = this.br.query(query)
		const results = parserQuery.matches(tree)
		const endTime = performance.now()
		console.log(`Query: ${endTime - startTime} milliseconds`)
		return results
	}

	getFunctionRanges(tree: Parser.Tree): {node: Parser.SyntaxNode, start: number, end: number}[] {
		const results = this.match(fnQuery, tree.rootNode)

		const ranges: {node: Parser.SyntaxNode, start: number, end: number}[] = []
		let fnNode: Parser.SyntaxNode | undefined = undefined
		for (const result of results) {
			if (result.captures[0].node.type === "def_statement"){
				fnNode = result.captures[0].node
				if (result.captures[2]){
					ranges.push({
						node: fnNode,
						start: fnNode.startIndex,
						end: fnNode.endIndex
					})
					fnNode = undefined
				}

			} else if (fnNode && result.captures[0].node.type === "fnend_statement") {
				const fnEnd = result.captures[0]
				// if in func
				ranges.push({
					node: fnNode,
					start: fnNode.startIndex,
					end: fnEnd.node.startIndex,
				})
			}
		}
		return ranges
	}

	isParamOfFunction(node: Parser.SyntaxNode, fn: Parser.SyntaxNode): boolean {
		let isParam = false

		const paramResult = fn.descendantsOfType("parameter")
		for (const param of paramResult) {
			const child = param.namedChild(0)?.namedChild(0)
			if (child?.type === node.parent?.type && node.text.toLowerCase() === child?.text.toLowerCase().replace(/^mat[ \t]+/,"")){
				// filter occurences outside of function
				isParam = true
			}
		}

		// const paramResult = this.match("(parameter) @param", fn);
		// for (const param of paramResult) {
		// 	const child = param.captures[0].node.namedChild(0)?.namedChild(0)
		// 	if (child?.type === node.parent?.type && node.text === child?.text.replace(/^mat[ \t]+/,"")){
		// 		// filter occurences outside of function
		// 		isParam = true
		// 	}
		// }

		return isParam
	}

	inFunction(node: Parser.SyntaxNode,  
		ranges: {
			node: Parser.SyntaxNode;
			start: number;
			end: number;
		}[],): { node: Parser.SyntaxNode, endIndex: number } | null {

		let inFunction = false
		for (const range of ranges) {
			if (node.startIndex >= range.start && node.endIndex <= range.end) {
				// if param
				inFunction = true
				return {
					node: range.node,
					endIndex: range.end
				}
			} 
		}
		return null
	}

	getNodeAtPosition(document: TextDocument, position: Position): Parser.SyntaxNode {
		const tree = this.getTree(document)
		const node = tree.rootNode.descendantForPosition(this.getPoint(position))
		return node
	}

	getOccurences(word: string, document: TextDocument, range: Range): Range[] {
		const occurrences: Range[] = []

		const tree = this.getTree(document)
		
		const node = tree.rootNode.descendantForPosition(this.getPoint(range.start))

		const name_match = word.replace(/\w/g, c => {
			return `[${c.toUpperCase()}${c.toLowerCase()}]`
		}).replace("$","\\\\$").replace(":","")

		switch (node.type) {
			case "label_reference":
			case "label": {
				const query = `((label) @label
				(#match? @label "^${name_match}:$"))
				((label_reference) @label_ref
				(#match? @label_ref "^${name_match}$"))`
				const results = this.match(query, tree.rootNode)
				results.forEach(r => {
					const node = r.captures[0].node
					if (node.type === "label"){
						occurrences.push(new Range(new Position(node.startPosition.row, node.startPosition.column),new Position(node.endPosition.row, node.endPosition.column-1)))
					} else {
						occurrences.push(this.getNodeRange(r.captures[0].node))
					}
				});
			}
			break;
			case "function_name": {
				const selector = `(function_name) @occurrence`
				const predicate = `(#match? @occurrence "^${name_match}$")`
				const query = `(${selector} ${predicate})`
				const results = this.match(query, tree.rootNode)
				results.forEach(r => {
					occurrences.push(this.getNodeRange(r.captures[0].node))
				});
			}
			break;
		
			default: {
				const selector = `${node.parent?.type} name: (_) @occurrence`
				const predicate = `(#match? @occurrence "^${name_match}$")`
				const query = `(${selector} ${predicate})`
				let results = this.match(query, tree.rootNode)
				results = this.filterOccurrences(node, tree, results)
				results.forEach(r => {
					occurrences.push(this.getNodeRange(r.captures[0].node))
				});
			}
			break;
		}
		
	


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
