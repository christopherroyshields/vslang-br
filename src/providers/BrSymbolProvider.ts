import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode";

const LABEL_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?(?<label>\w[\w\d]*):)/gi
const FUNCTION_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?def\s+(?:library\s+)?(?<fn>\w[\w\d]*)\b)/gi

export default class BrSourceSymbolProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(doc: TextDocument, token: CancellationToken): SymbolInformation[] | DocumentSymbol[] {
    const symbolInfoList: DocumentSymbol[] = []

    const labelMatches = doc.getText().matchAll(LABEL_SEARCH)
    for (const labelMatch of labelMatches) {
      if (labelMatch[1]){
        const whiteSpace = labelMatch[0].search(/\S/)
        if (labelMatch.index !== undefined){
          const start = labelMatch.index + whiteSpace
          const end = labelMatch.index + labelMatch[0].length - 1
          const selectionRange = new Range(doc.positionAt(start),doc.positionAt(end))
          const labelRange = doc.lineAt(doc.positionAt(start).line).range
          const symbolInfo = new DocumentSymbol(labelMatch[1], 'label', SymbolKind.Null, labelRange, selectionRange)
          symbolInfoList.push(symbolInfo)
        }
      }
    }

    const funcMatches = doc.getText().matchAll(FUNCTION_SEARCH)
    for (const funcMatch of funcMatches) {
      if (funcMatch[1]){
        const whiteSpace = funcMatch[0].search(/\S/)
        if (funcMatch.index !== undefined){
          const start = funcMatch.index + whiteSpace
          const end = funcMatch.index + funcMatch[0].length - 1
          const selectionRange = new Range(doc.positionAt(start),doc.positionAt(end))
          const labelRange = doc.lineAt(doc.positionAt(start).line).range
          const symbolInfo = new DocumentSymbol(funcMatch[1], 'function', SymbolKind.Function, labelRange, selectionRange)
          symbolInfoList.push(symbolInfo)
        }
      }
    }

    return symbolInfoList
  }
}