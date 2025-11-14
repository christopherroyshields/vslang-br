// import * as Parser from "web-tree-sitter";
import * as Parser from "../vendor/tree-sitter"
// const Parser = require("tree-sitter")
const BrLang = require("tree-sitter-br")
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, DocumentSymbol, ExtensionContext, Position, Range, SymbolKind, TextDocument, TextDocumentChangeEvent, Uri, workspace} from 'vscode';
import { performance } from 'perf_hooks';
import { Disposable } from 'vscode';
import { EOL } from 'os';
import * as fs from 'fs';
import UserFunction from './class/UserFunction';
import UserFunctionParameter from './class/UserFunctionParameter';
import { nodeRange } from './util/common';
import DocComment from './class/DocComment';
import { VariableType } from './types/VariableType';
const fnQuery = fs.readFileSync(path.join(__dirname,"..","tree-query","function_def.scm")).toString()

export default class BrParser implements Disposable {
	br!: Parser.Language
	parser!: Parser
	trees: Map<string, Parser.Tree> = new Map<string, Parser.Tree>()
	dispose(): void {
		// this.trees.forEach(t => t.delete())
	}

	activate(context: ExtensionContext): void {
		// await Parser.Parser.init();
		// this.br = await Parser.Language.load(path.resolve(__dirname, "..", 'tree-sitter-br.wasm'))
		this.parser = new Parser()
		this.parser.setLanguage(BrLang)
		this.br = BrLang

		context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
			const document = e.document;
			if (document.languageId === "br"){
				this.updateTree(e);
			}
		}))
	}

  async getFunctionByName(name: string, uri: Uri): Promise<UserFunction | undefined> {
		const tree = await this.getUriTree(uri)
		if (tree){
			const name_match = name.replace(/[a-zA-Z]/g, c => {
				return `[${c.toUpperCase()}${c.toLowerCase()}]`
			}).replace("$","\\\\$")
	
			const query = `(
				(line (doc_comment) @doc_comment)?
				.
				(line
				(def_statement 
					[
					(numeric_function_definition (function_name) @name
						(parameter_list)? @params
						) @type
						(string_function_definition (function_name) @name
						(parameter_list)? @params
						) @type
					]) @def)
					(#match? @name "^${name_match}$")
				)`
	
			const results = this.match(query, tree.rootNode)
			if (results.length){
				const fn = this.toFn(results[0])
				return fn
			}
		}
  }

	getLocalFunctionList(document: TextDocument): UserFunction[] {
		const fnList: UserFunction[] = []
		const tree = this.getDocumentTree(document)
		const query = `(
			(line (doc_comment) @doc_comment)?
			.
			(line
			(def_statement 
				[
				(numeric_function_definition (function_name) @name
					(parameter_list)? @params
					) @type
					(string_function_definition (function_name) @name
					(parameter_list)? @params
					) @type
				]) @def)
			)`

		const results = this.match(query, tree.rootNode)
		for (const result of results) {
			const fn = this.toFn(result)
			if (fn){
				fnList.push(fn)
			}
		}
		return fnList
	}

	getCaptureByName(result: Parser.QueryMatch, name: string): Parser.SyntaxNode | undefined {
		for (const capture of result.captures) {
			if (capture.name === name){
				return capture.node
			}
		}
	}

  toFn(result: Parser.QueryMatch): UserFunction {
		const docNode = this.getCaptureByName(result, "doc_comment")
		const defNode = this.getCaptureByName(result, "def")
		const nameNode = this.getCaptureByName(result, "name")
		const paramsNode = this.getCaptureByName(result, "params")
		if (nameNode && defNode){
			let isLibrary = false
			if (defNode.descendantsOfType("library_keyword").length > 0){
				isLibrary = true
			}
			const fn = new UserFunction(nameNode.text,isLibrary, nodeRange(nameNode))
			const docs = docNode ? DocComment.parse(docNode.text) : undefined
			fn.documentation = docs?.text
			if (paramsNode){
				for (const param of paramsNode.namedChildren) {
					if (param!==null){
						const p = new UserFunctionParameter
						const typeNode = param.firstNamedChild?.firstNamedChild
						const nameNode = typeNode?.firstNamedChild
						if (nameNode && typeNode){
							p.name = nameNode.text
							if (param.type === "required_parameter"){
								p.isOptional = false
							} else {
								p.isOptional = true
							}
							if (param.firstChild?.firstChild?.text === "&"){
								p.isReference = true
							} else {
								p.isReference = false
							}
							p.documentation = docs?.params.get(nameNode.text)
							p.length = this.getStringParamLengthFromNode(param)
							p.type = this.getParamTypeFromNode(typeNode)
							fn.params.push(p)
						}
					}
				}
			}
			return fn
		}
		throw Error("Could not parse result")
  }

	getParamTypeFromNode(param: Parser.SyntaxNode): VariableType {
    switch (param.type) {
      case 'string_parameter':
        return VariableType.string
      case 'numeric_parameter':
        return VariableType.number
      case 'string_array_parameter':
        return VariableType.stringarray
      case 'number_array_parameter':
        return VariableType.numberarray
      default:
        throw new Error(`Unknown parameter type: ${param.type}`)
    }
  }

	getStringParamLengthFromNode(param: Parser.SyntaxNode): number | undefined {
    const lengthNodes = param.descendantsOfType("int")
    if (lengthNodes !== null && lengthNodes[0] !== null && lengthNodes.length) {
      const lengthNode = lengthNodes[0]
      return parseInt(lengthNode.text)
    } else {
      return undefined
    }
  }


	getDocumentTree(document: TextDocument):  Parser.Tree {
		// const startTime = performance.now()
		const tree = this.parser.parse(document.getText())
		// const endTime = performance.now()
		// console.log(`Parse: ${endTime - startTime} milliseconds`)
		
		if (tree){
			return tree
		} else {
			throw new Error("Could not parse document text.");
		}
	}

  getBufferTree(uri: Uri, buffer: Buffer) {
		try {
			const tree: Parser.Tree = this.parser.parse(buffer.toString())
			this.trees.set(uri.toString(),tree)
			return tree
		}	catch (error) {
			console.error("Error parsing text:", error)
		}
  }	

	getTextTree(uri: Uri, text: string): Parser.Tree | undefined {
		try {
			const tree: Parser.Tree = this.parser.parse(text)
			this.trees.set(uri.toString(),tree)
			return tree
		}	catch (error) {
			console.error("Error parsing text:", error)
		}
	}
	
	async getUriTree(uri: Uri, update = false): Promise<Parser.Tree | undefined> {
		const document = this.getOpenDocument(uri)
		if (document){
			return this.getDocumentTree(document)
		} else {
			let tree: Parser.Tree | undefined | null
			if (!update && this.trees.has(uri.toString())){
				tree = this.trees.get(uri.toString())
				if (tree){
					return tree
				}
			} else {
				const buffer = await workspace.fs.readFile(uri)
				tree = this.parser.parse(buffer.toString())
				if (tree){
					this.trees.set(uri.toString(),tree)
					// tree.delete()
				} else {
					throw new Error("Could not parse text of " + uri.toString())
				}
				return tree
			}
		}
	}

	getOpenDocument(uri: Uri): TextDocument | undefined {
		for (const doc of workspace.textDocuments) {
			if (doc.uri.toString() === uri.toString()){
				return doc
			}
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
			if (tree) this.trees.set(document.uri.toString(), tree)
		} else {
			const startTime = performance.now()
			const tree = this.parser.parse(document.getText());
			const endTime = performance.now()
			console.log(`Parse: ${endTime - startTime} milliseconds`)
			if (tree) this.trees.set(document.uri.toString(), tree)
		}
	}

	async getErrors(uri: Uri, document: string): Promise<Diagnostic[]> {
		const errorQuery = new Parser.Query(this.br, '(ERROR) @error (MISSING) @missing')
		const diagnostics: Diagnostic[] = []
		const tree = this.parser.parse(document)
		if (tree){
			const errors = errorQuery.matches(tree.rootNode);
			// collection.clear();
			for (const error of errors) {
				for (const capture of error.captures) {
					let message = 'Parsing Error: Invalid Sequence'
					if (capture.name === 'missing') {
						message = 'Parsing Error: Missing Node'
					}
					diagnostics.push({
						code: '',
						message: message,
						range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
						severity: DiagnosticSeverity.Error,
						source: 'BR Syntax Scanner'
					})
				}
			}
			// tree.delete()
		}
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
		
		const parserQuery = new Parser.Query(this.br, query)
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
			if (param){
				const child = param.namedChild(0)?.namedChild(0)
				if (child?.type === node.parent?.type && node.text.toLowerCase() === child?.text.toLowerCase().replace(/^mat[ \t]+/,"")){
					// filter occurences outside of function
					isParam = true
				}
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

	/**
	 * Get the syntax node at a specific position in the document.
	 * @param document The text document to search in.
	 * @param position The position to find the node at.
	 * @returns The syntax node at the specified position, or null if not found.
	 */

	getNodeAtPosition(document: TextDocument, position: Position): Parser.SyntaxNode | null {
		const tree = this.getDocumentTree(document)
		const node = tree.rootNode.namedDescendantForPosition(this.getPoint(position))
		return node
	}

	/**
	 * Find the nearest node of a specific type by walking backwards through the tree.
	 * Checks current node and parents, then walks through prior siblings of each parent.
	 * @param node The starting node to search from.
	 * @param nodeType The type of node to find.
	 * @returns The nearest node of the specified type, or null if not found.
	 */
	findNearestNodeOfType(node: Parser.SyntaxNode, nodeType: string): Parser.SyntaxNode | null {
		// Check if current node matches
		if (node.type === nodeType) {
			return node;
		}
		
		// Check ancestors and their prior siblings
		let currentNode: Parser.SyntaxNode | null = node;
		while (currentNode) {
			// Check prior siblings of current node
			let sibling = currentNode.previousSibling;
			while (sibling) {
				if (sibling.type === nodeType) {
					return sibling;
				}
				// Move on to the next sibling
				sibling = sibling.previousSibling;
			}
			
			// Move up to parent
			currentNode = currentNode.parent;
			
			// Stop the search if we reach a line node
			if (currentNode?.type === 'line') {
				break;
			}
			
			// Check if current parent matches
			if (currentNode?.type === nodeType) {
				return currentNode;
			}
		}
		
		return null;
	}



	getOccurences(word: string, document: TextDocument, range: Range): Range[] {
		const occurrences: Range[] = []

		const tree = this.getDocumentTree(document)
		
		const node = tree.rootNode.descendantForPosition(this.getPoint(range.start))

		console.log("Node Type:" + node.type)

		if (node){
			
			const name_match = word.replace(/[A-Za-z]/g, c => {
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

				case "stringidentifier":
				case "numberidentifier": {
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
		const errorQuery = new Parser.Query(this.br, '(ERROR) @error')
		const missingQuery = new Parser.Query(this.br, '(MISSING) @missing')
		const tree = this.getDocumentTree(document)
		const errors = errorQuery.matches(tree.rootNode);
		const missings = missingQuery.matches(tree.rootNode);
		const diagnostics: Diagnostic[] = []
		// collection.clear();
		for (const error of errors) {
			for (const capture of error.captures) {
				diagnostics.push({
					code: '',
					message: 'Parsing Error: Invalid Sequence',
					range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
					severity: DiagnosticSeverity.Error,
					source: 'BR Syntax Scanner',
					// relatedInformation: [
					//   new DiagnosticRelatedInformation(new Location(document.uri, new Range(new Position(1, 8), new Position(1, 9))), 'first assignment to `x`')
					// ]
				})
			}
		}
		for (const missing of missings) {
			for (const capture of missing.captures) {
				diagnostics.push({
					code: '',
					message: 'Parsing Error: Missing Node',
					range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
					severity: DiagnosticSeverity.Error,
					source: 'BR Syntax Scanner',
				})
			}
		}
		return diagnostics
	}

  getSymbols(document: TextDocument): Parser.SyntaxNode[] {
		const nodeList = new Array<Parser.SyntaxNode>()
		const tree = this.getDocumentTree(document)
		const query = `(def_statement) @def
		(dim_statement [
			(numberreference)
				(stringreference)
				(numberarray)
				(stringarray)
				] @symbol)
		(label) @label`
		const results = this.match(query, tree.rootNode)

		for (const result of results) {
			const node = result.captures[0].node
			nodeList.push(node)
		}
		
		return nodeList
  }
}
