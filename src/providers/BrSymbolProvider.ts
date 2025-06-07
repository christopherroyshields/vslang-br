import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode"
import BrParser from "../parser"

export default class BrSourceSymbolProvider implements DocumentSymbolProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideDocumentSymbols(doc: TextDocument, token: CancellationToken): DocumentSymbol[] {
    const results = this.parser.getSymbols(doc)
		const symbolInfoList: DocumentSymbol[] = []
		for (const node of results) {
			switch (node.type) {
				case 'label': {
						const labelRange = new Range(doc.positionAt(node.startIndex),doc.positionAt(node.endIndex))
						const symbolInfo = new DocumentSymbol(node.text, 'label', SymbolKind.Null, labelRange, labelRange)
						symbolInfoList.push(symbolInfo)
					}
					break;
				case 'stringreference': 
        case 'numberreference':        
        case 'numberarray':
        case 'stringarray': {
            const nameNode = node.childForFieldName("name")
            if (nameNode) {
              const dimRange = new Range(doc.positionAt(nameNode.startIndex),doc.positionAt(nameNode.endIndex))
              const type = node.type === 'stringreference' ? 'string' : node.type === 'numberreference' ? 'number' : node.type === 'stringarray' ? 'stringarray' : 'numberarray'
              const symbolInfo = new DocumentSymbol(nameNode.text, type, SymbolKind.Variable, dimRange, dimRange)
              symbolInfoList.push(symbolInfo)
            }
					}
					break;
				case 'def_statement': {
						const name = node.descendantsOfType("function_name")
						if (name.length){
							const node = name[0]
							if (node){
								const fnRange = new Range(doc.positionAt(node.startIndex),doc.positionAt(node.endIndex))
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