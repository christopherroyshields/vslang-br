"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncCompletionProvider = void 0;
const path = require("path");
const vscode_1 = require("vscode");
const BrSourceDocument_1 = require("../class/BrSourceDocument");
const BaseCompletionProvider_1 = require("./BaseCompletionProvider");
/**
 * Library statement linkage list completion provider
 */
class FuncCompletionProvider extends BaseCompletionProvider_1.BaseCompletionProvider {
    constructor(configuredProjects) {
        super(configuredProjects);
    }
    provideCompletionItems(doc, position, token) {
        const completionItems = [];
        const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
        if (workspaceFolder) {
            const project = this.configuredProjects.get(workspaceFolder);
            if (project) {
                for (const [uri, lib] of project.libraries) {
                    if (uri !== doc.uri.toString()) {
                        for (const fn of lib.libraryList) {
                            if (fn.isLibrary) {
                                completionItems.push({
                                    kind: vscode_1.CompletionItemKind.Function,
                                    label: {
                                        label: fn.name,
                                        detail: ' (library function)',
                                        description: path.basename(lib.uri.fsPath)
                                    },
                                    detail: `(library function) ${fn.name}${fn.generateSignature()}`,
                                    documentation: new vscode_1.MarkdownString(fn.getAllDocs())
                                });
                            }
                        }
                    }
                }
            }
        }
        const source = new BrSourceDocument_1.BrSourceDocument(doc.uri, doc.getText());
        for (const fn of source.libraryList) {
            completionItems.push({
                kind: vscode_1.CompletionItemKind.Function,
                label: {
                    label: fn.name,
                    detail: ` (${fn.isLibrary ? 'library' : 'local'} function)`
                },
                detail: `(${fn.isLibrary ? 'library' : 'local'} function) ${fn.name}${fn.generateSignature()}`,
                documentation: new vscode_1.MarkdownString(fn.getAllDocs())
            });
        }
        return completionItems;
    }
}
exports.FuncCompletionProvider = FuncCompletionProvider;
//# sourceMappingURL=FuncCompletionProvider.js.map