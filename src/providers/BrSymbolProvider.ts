import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode";

const LABEL_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?(?<label>\w[\w\d]*):)/gi

export class BrSourceSymbolProvider implements DocumentSymbolProvider {
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


      // const pos = new Position(labelMatch.groups)
      // const loc = new Location(doc.uri, new Position(1,0))
      // const symbol1 = new SymbolInformation("foo1", SymbolKind.Function, "container", loc)
      // const symbol2 = new SymbolInformation("foo2", SymbolKind.Function, "container", new Location(doc.uri, new Position(0,0)))
    }

    return symbolInfoList
  }
}