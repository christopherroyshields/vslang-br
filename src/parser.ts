import Parser = require('web-tree-sitter');
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticRelatedInformation, DiagnosticSeverity, ExtensionContext, languages, Location, Position, Range, TextDocument, window } from 'vscode';

export async function activateParser(context: ExtensionContext) {
	Parser.init().then(() => {
		const parser = new Parser;
		Parser.Language.load(path.resolve(__dirname, "..", 'tree-sitter-br.wasm')).then(
			(br) => {
				parser.setLanguage(br)
				// const code = 
				// `print mat foo, mat bar
				// print mat foo$, mat bar$, baz$(1)
				// print a,b,c
				// print a$,b$,c$`
				// ;
				
				// const refQuery = 
				// `(number_array_name) @number_arrays
				// (string_array_name) @string_arrays
				// (number_name) @numeric
				// (string_name) @string`
				// ;
				
				// const tree = parser.parse(code);
				// const query = br.query(refQuery);
	
				// const matches = query.matches(tree.rootNode);
				// console.dir(matches);

				const collection = languages.createDiagnosticCollection('test');
				if (window.activeTextEditor) {
					updateDiagnostics(window.activeTextEditor.document, collection, parser, br);
				}
				context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
					if (editor) {
						updateDiagnostics(editor.document, collection, parser, br);
					}
				}));
			}
		);
	});
}

function updateDiagnostics(document: TextDocument, collection: DiagnosticCollection, parser: Parser, br: Parser.Language): void {

  const tree = parser.parse(document.getText());
  const errorQuery = br.query('(ERROR) @error')
  const errors = errorQuery.matches(tree.rootNode);
  const diagnostics: Diagnostic[] = []
  collection.clear();
  for (const error of errors) {
    for (const capture of error.captures) {
      diagnostics.push({
        code: '',
        message: 'Syntax error',
        range: new Range(new Position(capture.node.startPosition.row, capture.node.startPosition.column), new Position(capture.node.endPosition.row, capture.node.endPosition.column)),
        severity: DiagnosticSeverity.Error,
        source: '',
        // relatedInformation: [
        //   new DiagnosticRelatedInformation(new Location(document.uri, new Range(new Position(1, 8), new Position(1, 9))), 'first assignment to `x`')
        // ]
      })
    }
  }
  
  collection.set(document.uri, diagnostics);

  // if (document && path.basename(document.uri.fsPath) === 'sample-demo.rs') {
	// 	collection.set(document.uri, [{
	// 		code: '',
	// 		message: 'cannot assign twice to immutable variable `x`',
	// 		range: new Range(new Position(3, 4), new Position(3, 10)),
	// 		severity: DiagnosticSeverity.Error,
	// 		source: '',
	// 		relatedInformation: [
	// 			new DiagnosticRelatedInformation(new Location(document.uri, new Range(new Position(1, 8), new Position(1, 9))), 'first assignment to `x`')
	// 		]
	// 	}]);
	// } else {
	// 	collection.clear();
	// }
}
