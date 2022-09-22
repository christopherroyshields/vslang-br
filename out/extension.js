"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const lexi_1 = require("./lexi");
const next_prev_1 = require("./next-prev");
const client_1 = require("./client");
const statements_1 = require("./statements");
const vscode_languageclient_1 = require("vscode-languageclient");
const path = require("path");
const functions_1 = require("./completions/functions");
const BrParamType_1 = require("./types/BrParamType");
const DocComment_1 = require("./types/DocComment");
function activate(context) {
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
    (0, client_1.activateClient)(context);
    activateWorkspaceFolders(context);
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position) => {
            const completionItems = [];
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
            if (workspaceFolder) {
                const config = ProjectConfigs.get(workspaceFolder);
                if (config?.libraries) {
                    for (const [uri, lib] of config.libraries) {
                        for (const fn of lib) {
                            completionItems.push({
                                kind: vscode_languageclient_1.CompletionItemKind.Function,
                                label: {
                                    label: fn.name,
                                    detail: ' (library function)',
                                    description: path.basename(uri.fsPath)
                                },
                                detail: `(library function) ${fn.name}${fn.generateSignature()}`,
                                documentation: fn.getAllDocs()
                            });
                        }
                    }
                }
            }
            let userFunctions;
            userFunctions = parseFunctionsFromSource(doc.getText(), false);
            for (let fnIndex = 0; fnIndex < userFunctions.length; fnIndex++) {
                const fn = userFunctions[fnIndex];
                completionItems.push({
                    kind: vscode_languageclient_1.CompletionItemKind.Function,
                    label: {
                        label: fn.name,
                        detail: ' (local function)'
                    },
                    detail: `(local function) ${fn.name}${fn.generateSignature()}`,
                    documentation: fn.getAllDocs()
                });
            }
            return completionItems;
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
const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][^/]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))/gi;
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi;
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g;
function parseFunctionsFromSource(sourceText, librariesOnly = true) {
    let functions = [];
    let matches = sourceText.matchAll(FIND_COMMENTS_AND_FUNCTIONS);
    let match = matches.next();
    while (!match.done) {
        if (match.value.groups?.name && (!librariesOnly || match.value.groups?.isLibrary)) {
            const lib = new functions_1.UserFunction(match.value.groups.name);
            let fnDoc;
            if (match.value.groups.comments) {
                fnDoc = DocComment_1.DocComment.parse(match.value.groups.comments);
                lib.documentation = fnDoc.text;
            }
            if (match.value.groups.params) {
                lib.params = [];
                // remove line continuations
                const params = match.value.groups.params.replace(LINE_CONTINUATIONS, "");
                const it = params.matchAll(PARAM_SEARCH);
                let isOptional = false;
                for (const paramMatch of it) {
                    if (paramMatch.groups && paramMatch.groups.name) {
                        if (paramMatch.groups.name.trim() == "___") {
                            break;
                        }
                        const libParam = new functions_1.UserFunctionParameter();
                        libParam.name = paramMatch.groups.name;
                        libParam.isReference = paramMatch.groups.isReference ? true : false;
                        libParam.isOptional = isOptional;
                        if (paramMatch.groups.isString) {
                            if (paramMatch.groups.isArray) {
                                libParam.type = BrParamType_1.BrParamType.stringarray;
                            }
                            else {
                                libParam.type = BrParamType_1.BrParamType.string;
                                if (paramMatch.groups.length) {
                                    libParam.length = parseInt(paramMatch.groups.length);
                                }
                            }
                        }
                        else {
                            if (paramMatch.groups.isArray) {
                                libParam.type = BrParamType_1.BrParamType.numberarray;
                            }
                            else {
                                libParam.type = BrParamType_1.BrParamType.number;
                            }
                        }
                        if (fnDoc?.params) {
                            libParam.documentation = fnDoc.params.get(paramMatch.groups.name);
                        }
                        lib.params.push(libParam);
                        if (!isOptional && paramMatch.groups.delimiter && paramMatch.groups.delimiter == ';') {
                            isOptional = true;
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
const ProjectConfigs = new Map();
const GlobalLibraries = new Map();
/**
 * Sets up monitoring of project configuration
 * @param context extension context
 */
function activateWorkspaceFolders(context) {
    if (vscode.workspace.workspaceFolders) {
        vscode.workspace.workspaceFolders.forEach(async (workspaceFolder) => {
            let projectWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, 'br-project.json'));
            updateGlobalLibraries(workspaceFolder);
            projectWatcher.onDidChange((uri) => {
                updateGlobalLibraries(workspaceFolder);
            }, undefined, context.subscriptions);
            projectWatcher.onDidCreate((uri) => {
                updateGlobalLibraries(workspaceFolder);
            }, undefined, context.subscriptions);
            projectWatcher.onDidDelete((uri) => {
                ProjectConfigs.delete(workspaceFolder);
            }, undefined, context.subscriptions);
        });
    }
}
async function updateGlobalLibraries(workspaceFolder) {
    let projectFileUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"));
    ProjectConfigs.delete(workspaceFolder);
    try {
        let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri);
        if (projectConfigText) {
            let config = JSON.parse(projectConfigText.toString());
            const projectConfig = {};
            ProjectConfigs.set(workspaceFolder, projectConfig);
            if (config.globalIncludes?.length) {
                config.globalIncludes.forEach(async (filePath) => {
                    let uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath));
                    try {
                        let libText = await vscode.workspace.fs.readFile(uri);
                        if (libText) {
                            if (!projectConfig.libraries)
                                projectConfig.libraries = new Map();
                            projectConfig.libraries.set(uri, parseFunctionsFromSource(libText.toString()));
                        }
                    }
                    catch {
                        vscode.window.showWarningMessage(`Global library not found ${uri.fsPath}`);
                    }
                });
            }
        }
    }
    catch (error) {
        console.log('no project file in workspace');
    }
}
//# sourceMappingURL=extension.js.map