"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const lexi_1 = require("./lexi");
const next_prev_1 = require("./next-prev");
const client_1 = require("./client");
const statements_1 = require("./statements");
const path = require("path");
const ProjectConfigs = new Map();
const GlobalLibraries = new Map();
function activate(context) {
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
    (0, client_1.activateClient)(context);
    if (vscode.workspace.workspaceFolders?.length) {
        vscode.workspace.workspaceFolders.forEach(async (workspaceFolder) => {
            let projectFileUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"));
            try {
                let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri);
                if (projectConfigText) {
                    let config = JSON.parse(projectConfigText.toString());
                    ProjectConfigs.set(workspaceFolder, config);
                    if (config.globalIncludes?.length) {
                        config.globalIncludes.forEach(async (filePath) => {
                            let uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath));
                            try {
                                let libText = await vscode.workspace.fs.readFile(uri);
                                if (libText) {
                                    GlobalLibraries.set(uri, {
                                        uri: uri,
                                        functions: parseFunctionsFromSource({
                                            text: libText.toString(),
                                            librariesOnly: true
                                        })
                                    });
                                }
                            }
                            catch {
                                console.log('global library not found');
                            }
                        });
                    }
                }
            }
            catch (error) {
                console.log('no project file in workspace');
            }
        });
    }
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position) => {
            let completionItems = [];
            return Promise.resolve(completionItems);
        }
    });
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position) => {
            let word = doc.getText(doc.getWordRangeAtPosition(position));
            let isLower = !/[A-Z]/.test(word);
            return statements_1.Statements.map((s) => {
                let md = new vscode.MarkdownString();
                let item = {
                    label: {
                        label: isLower ? s.name.toLocaleLowerCase() : s.name,
                        description: 'statement'
                    },
                    detail: s.description,
                    documentation: md,
                    kind: vscode.CompletionItemKind.Keyword
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
    });
    console.log('Extension "vslang-br" is now active!');
}
exports.activate = activate;
function deactivate() {
    (0, client_1.deactivateClient)();
}
exports.deactivate = deactivate;
const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?<comments>\/\*[\s\S]*?\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))|(?<multiline_comment>\/\*.*\*\/)/gi;
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?:mat\s+)?[\w$]+(?:\s*)(?:\*\s*(?<length>\d+))?)\s*(?<delimiter>;|,)?/gi;
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g;
function parseFunctionsFromSource(opt) {
    let functions = [];
    let matches = opt.text.matchAll(FIND_COMMENTS_AND_FUNCTIONS);
    let match = matches.next();
    while (!match.done) {
        if (match.value.groups?.name && match.value.groups?.isLibrary) {
            const lib = {
                name: match.value.groups.name
            };
            if (match.value.groups.params) {
                lib.params = [];
                // remove line continuations
                const params = match.value.groups.params.replace(LINE_CONTINUATIONS, "");
                const it = params.matchAll(PARAM_SEARCH);
                let isOptional = false;
                for (const paramMatch of it) {
                    if (paramMatch.groups && paramMatch.groups.name) {
                        lib.params.push({
                            name: paramMatch.groups.name
                        });
                        if (paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';') {
                            isOptional = true;
                        }
                        if (paramMatch.groups.name.trim() == "___") {
                            break;
                        }
                    }
                }
            }
            functions.push(lib);
        }
        match = matches.next();
    }
    return functions;
}
//# sourceMappingURL=extension.js.map