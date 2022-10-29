"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrHoverProvider = void 0;
const vscode_1 = require("vscode");
const vscode_2 = require("vscode");
const SourceLibrary_1 = require("../class/SourceLibrary");
const functions_1 = require("../completions/functions");
const common_1 = require("../util/common");
class BrHoverProvider {
    constructor(configuredProjects) {
        this.configuredProjects = configuredProjects;
    }
    provideHover(doc, position, token) {
        const doctext = doc.getText();
        if ((0, common_1.isComment)(position, doctext, doc)) {
            return;
        }
        else {
            const wordRange = doc.getWordRangeAtPosition(position, /\w+\$?/);
            if (wordRange) {
                const word = doc.getText(wordRange);
                if (word) {
                    if (word.substring(0, 2).toLowerCase() == "fn") {
                        // local functions
                        const localSource = new SourceLibrary_1.SourceLibrary(doc.uri, doc.getText());
                        for (const fn of localSource.libraryList) {
                            if (fn.name.toLowerCase() == word.toLocaleLowerCase()) {
                                const hover = this.createHoverFromFunction(fn);
                                hover.range = wordRange;
                                return hover;
                            }
                        }
                        // library functions
                        const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
                        if (workspaceFolder) {
                            const project = this.configuredProjects.get(workspaceFolder);
                            if (project) {
                                for (const [uri, lib] of project.libraries) {
                                    for (const fn of lib.libraryList) {
                                        if (fn.name.toLowerCase() === word.toLocaleLowerCase()) {
                                            const hover = this.createHoverFromFunction(fn);
                                            hover.range = wordRange;
                                            return hover;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        // system functions
                        const fn = (0, functions_1.getFunctionByName)(word);
                        if (fn) {
                            const hover = this.createHoverFromFunction(fn);
                            hover.range = wordRange;
                            return hover;
                        }
                    }
                }
                // local functions
            }
        }
    }
    createHoverFromFunction(fn) {
        let markDownString = '```br\n' + fn.name + (0, functions_1.generateFunctionSignature)(fn) + '\n```\n---';
        if (markDownString && fn.documentation) {
            markDownString += '\n' + fn.documentation;
        }
        fn.params?.forEach((param) => {
            if (param.documentation) {
                markDownString += `\r\n * @param \`${param.name}\` ${param.documentation}`;
            }
        });
        let markup = new vscode_1.MarkdownString(markDownString);
        return new vscode_2.Hover(markup);
    }
}
exports.BrHoverProvider = BrHoverProvider;
//# sourceMappingURL=BrHoverProvider.js.map