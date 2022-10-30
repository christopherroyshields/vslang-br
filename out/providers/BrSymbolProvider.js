"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrSourceSymbolProvider = void 0;
const vscode_1 = require("vscode");
const LABEL_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?(?<label>\w[\w\d]*):)/gi;
class BrSourceSymbolProvider {
    provideDocumentSymbols(doc, token) {
        const symbolInfoList = [];
        const labelMatches = doc.getText().matchAll(LABEL_SEARCH);
        for (const labelMatch of labelMatches) {
            if (labelMatch[1]) {
                const whiteSpace = labelMatch[0].search(/\S/);
                if (labelMatch.index !== undefined) {
                    const start = labelMatch.index + whiteSpace;
                    const end = labelMatch.index + labelMatch[0].length - 1;
                    const selectionRange = new vscode_1.Range(doc.positionAt(start), doc.positionAt(end));
                    const labelRange = doc.lineAt(doc.positionAt(start).line).range;
                    const symbolInfo = new vscode_1.DocumentSymbol(labelMatch[1], 'label', vscode_1.SymbolKind.Null, labelRange, selectionRange);
                    symbolInfoList.push(symbolInfo);
                }
            }
            // const pos = new Position(labelMatch.groups)
            // const loc = new Location(doc.uri, new Position(1,0))
            // const symbol1 = new SymbolInformation("foo1", SymbolKind.Function, "container", loc)
            // const symbol2 = new SymbolInformation("foo2", SymbolKind.Function, "container", new Location(doc.uri, new Position(0,0)))
        }
        return symbolInfoList;
    }
}
exports.BrSourceSymbolProvider = BrSourceSymbolProvider;
//# sourceMappingURL=BrSymbolProvider.js.map