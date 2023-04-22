import Parser = require('web-tree-sitter');
import path = require('path');
import { Diagnostic, DiagnosticCollection, DiagnosticRelatedInformation, DiagnosticSeverity, ExtensionContext, languages, Location, Position, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { performance } from 'perf_hooks';
import { log } from 'console';

const trees = new Map<string, Parser.Tree>()

export async function activateParser(context: ExtensionContext) {
	
	await Parser.init();
	const br = await Parser.Language.load(path.resolve(__dirname, "..", 'tree-sitter-br.wasm'))
	const parser = new Parser()
	parser.setLanguage(br)

	const collection = languages.createDiagnosticCollection('Syntax');

	const sourceFiles = await workspace.findFiles("**/*.brs");
	console.log(`Found ${sourceFiles.length} files`);
	for (const sourceUri of sourceFiles) {
		try {
			const buffer = await workspace.fs.readFile(sourceUri);
			if (buffer){
				const text = buffer.toString();
				// parser.delete();
				updateDiagnostics(text, sourceUri, collection, parser, br);
			}
		} catch (error) {
			console.log(`error reading ${sourceUri.path}`)
			console.error(error);
		}
	}
	console.log(`Finished reading`);
	// if (window.activeTextEditor) {
	// 	updateDiagnostics(window.activeTextEditor.document, collection, parser, br);
	// }
	context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDiagnostics(editor.document.getText(), editor.document.uri, collection, parser, br);
		}
	}));
}

function updateDiagnostics(document: string, uri: Uri, collection: DiagnosticCollection, parser: Parser, br: Parser.Language): void {

	// let tree: Parser.Tree
	// if (trees.has(document.uri.toString())){
	// 	const startTime = performance.now()
	// 	tree = parser.parse(document.getText(), trees.get(document.uri.toString()));
	// 	const endTime = performance.now()
	// 	console.log(`Reparse: ${endTime - startTime} milliseconds`)
	// } else {
		const startTime = performance.now()
		const tree = parser.parse(document);
		const endTime = performance.now()
		console.log(`Parse: ${endTime - startTime} milliseconds`)
		// console.log(`Parse: ${endTime - startTime} milliseconds`)
	// }

	// trees.set(document.uri.toString(), tree)

  const errorQuery = br.query('(ERROR) @error')
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
        source: '',
        // relatedInformation: [
        //   new DiagnosticRelatedInformation(new Location(document.uri, new Range(new Position(1, 8), new Position(1, 9))), 'first assignment to `x`')
        // ]
      })
    }
  }
  
	if (diagnostics.length){
		collection.set(uri, diagnostics);
	}

	tree.delete()

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
