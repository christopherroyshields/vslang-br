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
                                    GlobalLibraries.set(uri, parseFunctionsFromSource(libText.toString()));
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
        });
    }
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position) => {
            const completionItems = [];
            for (const [uri, lib] of GlobalLibraries) {
                for (const fn of lib) {
                    completionItems.push({
                        kind: vscode_languageclient_1.CompletionItemKind.Function,
                        label: {
                            label: fn.name,
                            description: path.basename(uri.fsPath)
                        },
                        detail: `(function) ${fn.name}${(0, functions_1.generateFunctionSignature)(fn)}`,
                        documentation: fn.getAllDocs()
                    });
                }
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
class DocComment extends Object {
    constructor() {
        super();
        this.params = new Map();
    }
    /**
     * Function removes leading asterisk from comment lines
     * @param comments
     * @returns comments without asterisk
     */
    static cleanComments(comments) {
        return comments.replace(/^\s*\*\s/gm, "").trim();
    }
    static parse(commentText) {
        const docComment = new DocComment();
        // freeform text at beginning
        const textMatch = DocComment.textSearch.exec(commentText);
        if (textMatch != null) {
            docComment.text = DocComment.cleanComments(textMatch[0]);
        }
        // params
        const tagMatches = commentText.matchAll(DocComment.paramSearch);
        for (const tagMatch of tagMatches) {
            if (tagMatch.groups) {
                docComment.params.set(tagMatch.groups.name, tagMatch.groups.desc);
            }
        }
        return docComment;
    }
}
DocComment.textSearch = /^[\s\S]*?(?=@|$)/;
DocComment.paramSearch = /@(?<tag>param)[ \t]+(?<name>(?:mat\s+)?\w+\$?)?(?:[ \t]+(?<desc>.*))?/gmi;
const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))|(?<multiline_comment>\/\*.*\*\/)/gi;
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?(?:\s*)(?:\*\s*(?<length>\d+))?)\s*(?<delimiter>;|,)?/gi;
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
                fnDoc = DocComment.parse(match.value.groups.comments);
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
//# sourceMappingURL=extension.js.map