"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrSourceSymbolProvider = void 0;
const vscode_1 = require("vscode");
const LABEL_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?(?<label>\w[\w\d]*):)/gi;
const FUNCTION_SEARCH = /(?:\/\*[\s\S]+?(?:\*\/|$)|`[\s\S]+?(?:`|$)|(?:^|\n)\s*?(?:\d{0,5})(?:\s*)?def\s+(?:library\s+)?(?<fn>\w[\w\d]*)\b)/gi;
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
        }
        const funcMatches = doc.getText().matchAll(FUNCTION_SEARCH);
        for (const funcMatch of funcMatches) {
            if (funcMatch[1]) {
                const whiteSpace = funcMatch[0].search(/\S/);
                if (funcMatch.index !== undefined) {
                    const start = funcMatch.index + whiteSpace;
                    const end = funcMatch.index + funcMatch[0].length - 1;
                    const selectionRange = new vscode_1.Range(doc.positionAt(start), doc.positionAt(end));
                    const labelRange = doc.lineAt(doc.positionAt(start).line).range;
                    const symbolInfo = new vscode_1.DocumentSymbol(funcMatch[1], 'function', vscode_1.SymbolKind.Function, labelRange, selectionRange);
                    symbolInfoList.push(symbolInfo);
                }
            }
        }
        return symbolInfoList;
    }
}
exports.BrSourceSymbolProvider = BrSourceSymbolProvider;
//# sourceMappingURL=BrSymbolProvider.js.map