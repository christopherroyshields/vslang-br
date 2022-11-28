import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode"
import BrSourceDocument from "../class/BrSourceDocument"

export default class BrSourceSymbolProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(doc: TextDocument, token: CancellationToken): SymbolInformation[] | DocumentSymbol[] {
    const symbolInfoList: DocumentSymbol[] = []

    const brSource = new BrSourceDocument(doc.getText())

    for (const dim of brSource.dims) {
      const labelRange = new Range(doc.positionAt(dim.position.start),doc.positionAt(dim.position.end))
      const symbolInfo = new DocumentSymbol(dim.name, 'dim', SymbolKind.Variable, labelRange, labelRange)
      symbolInfoList.push(symbolInfo)
    }

    for (const label of brSource.labels) {
      const labelRange = new Range(doc.positionAt(label.offset.start),doc.positionAt(label.offset.end))
      const symbolInfo = new DocumentSymbol(label.name + ':', 'label', SymbolKind.Null, labelRange, labelRange)
      symbolInfoList.push(symbolInfo)
    }

    for (const fn of brSource.functions) {
      const fullRange = new Range(doc.positionAt(fn.offset.start),doc.positionAt(fn.offset.end))
      const selectionRange = fullRange //doc.lineAt(doc.positionAt(fn.offset.start).line).range
      const symbolInfo = new DocumentSymbol(fn.name, 'function', SymbolKind.Function, fullRange, selectionRange)
      symbolInfoList.push(symbolInfo)
    }

    return symbolInfoList
  }
}