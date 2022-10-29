"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatementCompletionProvider = void 0;
const vscode_1 = require("vscode");
const statements_1 = require("../statements");
const BaseCompletionProvider_1 = require("./BaseCompletionProvider");
/**
 * Library statement linkage list completion provider
 */
class StatementCompletionProvider extends BaseCompletionProvider_1.BaseCompletionProvider {
    constructor(configuredProjects) {
        super(configuredProjects);
    }
    provideCompletionItems(doc, position, token) {
        let word = doc.getText(doc.getWordRangeAtPosition(position));
        let isLower = !/[A-Z]/.test(word);
        return statements_1.Statements.map((s) => {
            let md = new vscode_1.MarkdownString();
            let item = {
                label: {
                    label: isLower ? s.name.toLocaleLowerCase() : s.name,
                    description: 'statement'
                },
                detail: s.description,
                documentation: md,
                kind: vscode_1.CompletionItemKind.Keyword
            };
            if (s.documentation)
                md.appendMarkdown(s.documentation);
            if (s.docUrl)
                md.appendMarkdown(` [docs...](${s.docUrl})`);
            if (s.example)
                md.appendCodeblock(s.example);
            return item;
        });
    }
}
exports.StatementCompletionProvider = StatementCompletionProvider;
//# sourceMappingURL=StatementCompletionProvider.js.map