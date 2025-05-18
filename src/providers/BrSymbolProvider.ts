import { CancellationToken, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument } from "vscode"
import BrParser from "../parser"

export default class BrSourceSymbolProvider implements DocumentSymbolProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideDocumentSymbols(doc: TextDocument, token: CancellationToken): SymbolInformation[] | DocumentSymbol[] {
    return this.parser.getSymbols(doc)
  }
}