import { CancellationToken, Location, Position, ProviderResult, ReferenceContext, ReferenceProvider, TextDocument } from "vscode";
import BrParser from "../parser";

export default class BrReferenceProvder implements ReferenceProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]> {
    const locations: Location[] = []
    const wordRange = document.getWordRangeAtPosition(position, /\w+\$?/)

    if (wordRange){
      // const hl = new DocumentHighlight(wordRange);
      // highlights.push(hl)

      const word = document.getText(wordRange)
      const ranges = this.parser.getOccurences(word, document, wordRange)
      ranges.forEach(r => {
        const loc = new Location(document.uri, r)
        locations.push(loc)
      });
    }

    return locations
  }
}