import { CancellationToken, DocumentHighlight, DocumentHighlightKind, DocumentHighlightProvider, Position, ProviderResult, TextDocument } from "vscode";
import BrParser from "../parser";

export default class OccurenceHighlightProvider implements DocumentHighlightProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<DocumentHighlight[]> {
    const highlights: DocumentHighlight[] = []
    const wordRange = document.getWordRangeAtPosition(position, /\w+\$?/)

    if (wordRange){
      const word = document.getText(wordRange)
      const ranges = this.parser.getOccurences(word, document, wordRange)
      ranges.forEach(r => {
        const hl = new DocumentHighlight(r)
        highlights.push(hl)
      });
    }

    return highlights
  }
}