import * as Parser from "web-tree-sitter";
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, DocumentSymbol, ExtensionContext, Position, Range, SymbolKind, TextDocument, TextDocumentChangeEvent, Uri, workspace} from 'vscode';
import { performance } from 'perf_hooks';
import { Disposable } from 'vscode-languageclient';
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
	parser!: Parser.Parser
	trees: Map<string, Parser.Tree> = new Map<string, Parser.Tree>()
	dispose(): void {
		this.trees.forEach(t => t.delete())
	}

	async activate(context: ExtensionContext): Promise<void> {
		await Parser.Parser.init();
		this.br = await Parser.Language.load(path.resolve(__dirname, "..", 'tree-sitter-br.wasm'))
		this.parser = new Parser.Parser()
		this.parser.setLanguage(this.br)

		context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
			const document  = e.document;
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
				(line (statement
				(def_statement 
					[
					(numeric_function_definition (function_name) @name
						(parameter_list)? @params
						) @type
						(string_function_definition (function_name) @name
						(parameter_list)? @params
						) @type
					]) @def))
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
			(line (statement
			(def_statement 
				[
				(numeric_function_definition (function_name) @name
					(parameter_list)? @params
					) @type
					(string_function_definition (function_name) @name
					(parameter_list)? @params
					) @type
				]) @def))
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

	getCaptureByName(result: Parser.QueryMatch, name: string): Parser.Node | undefined {
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
			if (defNode.descendantsOfType("library_keyword")){
				isLibrary = true
			}
			const fn = new UserFunction(nameNode.text,isLibrary, nodeRange(nameNode))
			const docs = docNode ? DocComment.parse(docNode.text) : undefined
			fn.documentation = docs?.text
			if (paramsNode){
				for (const param of paramsNode.namedChildren) {
					if (param!==null){
						const p = new UserFunctionParameter
						const nameNode = param.firstNamedChild?.firstNamedChild?.firstNamedChild
						if (nameNode){
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
							p.type = this.getParamTypeFromNode(nameNode)
							fn.params.push(p)
						}
					}
				}
			}
			return fn
		}
		throw Error("Could not parse result")
  }

	getParamTypeFromNode(param: Parser.Node): VariableType {
    switch (param.type) {
      case 'stringreference':
        return VariableType.string
      case 'numberreference':
        return VariableType.number
      case 'stringarray':
        return VariableType.stringarray
      case 'numberarray':
        return VariableType.numberarray
      default:
        throw new Error("Uknown type")
    }    
  }

	getStringParamLengthFromNode(param: Parser.Node): number | undefined {
    const lengthNodes = param.descendantsOfType("int")
    if (lengthNodes !== null && lengthNodes[0] !== null && lengthNodes.length) {
      const lengthNode = lengthNodes[0]
      return parseInt(lengthNode.text)
    } else {
      return undefined
    }
  }


	getDocumentTree(document: TextDocument):  Parser.Tree {
		const startTime = performance.now()
		let tree: Parser.Tree | undefined | null = this.trees.get(document.uri.toString())
		if (tree){
			return tree
		} else {
			const startTime = performance.now()
			tree = this.parser.parse(document.getText())
			const endTime = performance.now()
			console.log(`Parse: ${endTime - startTime} milliseconds`)
			
			if (tree){
				this.trees.set(document.uri.toString(),tree)
			} else {
				throw new Error("Could not parse document text.");
			}

			return tree
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
					this.trees.set(uri.toString(),tree.copy())
					tree.delete()
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
		const errorQuery = new Parser.Query(this.br, '(ERROR) @error')
		const diagnostics: Diagnostic[] = []
		const tree = this.parser.parse(document)
		if (tree){
			const errors = errorQuery.matches(tree.rootNode);
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
		}
		return diagnostics
	}

	filterOccurrences(node: Parser.Node,  tree: Parser.Tree, occurrences: Parser.QueryMatch[]): Parser.QueryMatch[]{
		// get function ranges
		const fnRanges: {
			node: Parser.Node;
			start: number;
			end: number;
		}[] = this.getFunctionRanges(tree)

		// if selection is in function and is param
		const fn: { node: Parser.Node, endIndex: number } | null = this.inFunction(node, fnRanges)
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

	match(query: string, tree: Parser.Node): Parser.QueryMatch[] {
		const startTime = performance.now()
		
		const parserQuery = new Parser.Query(this.br, query)
		const results = parserQuery.matches(tree)
		const endTime = performance.now()
		console.log(`Query: ${endTime - startTime} milliseconds`)
		return results
	}

	getFunctionRanges(tree: Parser.Tree): {node: Parser.Node, start: number, end: number}[] {
		const results = this.match(fnQuery, tree.rootNode)

		const ranges: {node: Parser.Node, start: number, end: number}[] = []
		let fnNode: Parser.Node | undefined = undefined
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

	isParamOfFunction(node: Parser.Node, fn: Parser.Node): boolean {
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

	inFunction(node: Parser.Node,  
		ranges: {
			node: Parser.Node;
			start: number;
			end: number;
		}[],): { node: Parser.Node, endIndex: number } | null {

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

	getNodeAtPosition(document: TextDocument, position: Position): Parser.Node | null {
		const tree = this.getDocumentTree(document)
		const node = tree.rootNode.namedDescendantForPosition(this.getPoint(position))
		return node
	}

	getOccurences(word: string, document: TextDocument, range: Range): Range[] {
		const occurrences: Range[] = []

		const tree = this.getDocumentTree(document)
		
		const node = tree.rootNode.descendantForPosition(this.getPoint(range.start))

		if (node){
			
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
					if (node.text.toLocaleLowerCase().substring(0,3)!=="mat"){
						const selector = `${node.parent?.type} name: (_) @occurrence`
						const predicate = `(#match? @occurrence "^${name_match}$")`
						const query = `(${selector} ${predicate})`
						let results = this.match(query, tree.rootNode)
						results = this.filterOccurrences(node, tree, results)
						results.forEach(r => {
							occurrences.push(this.getNodeRange(r.captures[0].node))
						});
					}
				}
				break;
			}
			
		}
		return occurrences
	}

	getNodeRange(node: Parser.Node){
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
		const tree = this.getDocumentTree(document)
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

  getSymbols(document: TextDocument): DocumentSymbol[] {
		const tree = this.getDocumentTree(document)
		const query = `(def_statement) @def
		(dim_statement
			(_
				name: (_) @dim)*)
		(label) @label`
		const results = this.match(query, tree.rootNode)
		
		const symbolInfoList: DocumentSymbol[] = []
		for (const result of results) {
			const node = result.captures[0].node
			switch (node.type) {
				case 'label': {
						const labelRange = new Range(document.positionAt(node.startIndex),document.positionAt(node.endIndex))
						const symbolInfo = new DocumentSymbol(node.text, 'label', SymbolKind.Null, labelRange, labelRange)
						symbolInfoList.push(symbolInfo)
					}
					break;
				case 'stringidentifier':
				case 'numberidentifier': {
						const dimRange = new Range(document.positionAt(node.startIndex),document.positionAt(node.endIndex))
						const symbolInfo = new DocumentSymbol(node.text, node.parent?.type ?? "", SymbolKind.Variable, dimRange, dimRange)
						symbolInfoList.push(symbolInfo)
					}
					break;
				case 'def_statement': {
						const name = node.descendantsOfType("function_name")
						if (name.length){
							const node = name[0]
							if (node){
								const fnRange = new Range(document.positionAt(node.startIndex),document.positionAt(node.endIndex))
								const symbolInfo = new DocumentSymbol(node.text, "function", SymbolKind.Function, fnRange, fnRange)
								symbolInfoList.push(symbolInfo)
							}
						}
					}
					break;
				default:
					break;
			}
		}
		return symbolInfoList
  }
}
