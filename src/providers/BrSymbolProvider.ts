import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode";
import BrSourceDocument from "../class/BrSourceDocument";

const LABEL_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?(?<label>\w[\w\d]*):)/gi
const FUNCTION_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?def\s+(?:library\s+)?(?<fn>\w[\w\d]*)\b)/gi

export default class BrSourceSymbolProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(doc: TextDocument, token: CancellationToken): SymbolInformation[] | DocumentSymbol[] {
    const symbolInfoList: DocumentSymbol[] = []

    const brSource = new BrSourceDocument(doc.getText())

    for (const label of brSource.labels) {
      const labelRange = new Range(doc.positionAt(label.offset.start),doc.positionAt(label.offset.end))
      const symbolInfo = new DocumentSymbol(label.name + ':', 'label', SymbolKind.Null, labelRange, labelRange)
      symbolInfoList.push(symbolInfo)
    }

    const funcMatches = doc.getText().matchAll(FUNCTION_SEARCH)
    for (const fn of brSource.functions) {
      const fullRange = new Range(doc.positionAt(fn.offset.start),doc.positionAt(fn.offset.end))
      const selectionRange = fullRange //doc.lineAt(doc.positionAt(fn.offset.start).line).range
      const symbolInfo = new DocumentSymbol(fn.name, 'function', SymbolKind.Function, fullRange, selectionRange)
      symbolInfoList.push(symbolInfo)
    }

    return symbolInfoList
  }
}