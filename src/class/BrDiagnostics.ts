import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Position, Range, TextDocument, Uri } from "vscode";
import Parser = require("web-tree-sitter");
import BrParser from "../parser";

export function updateDiagnostics(document: TextDocument, diagnosticCollection: DiagnosticCollection, parser: BrParser){
  const diagnostics: Diagnostic[] = getDiagnostics(document, parser)
  diagnosticCollection.set(document.uri, diagnostics);
}

function getDiagnostics(document: TextDocument, parser: BrParser): Diagnostic[] {

  const errorQuery = parser.br.query('(ERROR) @error')
  const tree = parser.getTree(document)
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
