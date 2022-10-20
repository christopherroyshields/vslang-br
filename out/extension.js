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
        provideCompletionItems: (doc, position, token, context) => {
            const completionItems = new vscode.CompletionList();
            const line = doc.getText(new vscode.Range(doc.lineAt(position).range.start, position));
            const ISLIBRARY_LINKAGE_LIST = /library(\s+(release\s*,)?(\s*nofiles\s*,)?\s*("|')([\w\\]+)("|'))?\s*:\s*(fn\w*\$?\s*,?\s*)*$/i;
            if (ISLIBRARY_LINKAGE_LIST.test(line)) {
                completionItems.items.push({
                    label: "fntest"
                });
            }
            return completionItems;
        }
    }, ":", ",", " ");
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position, token, context) => {
            const completionItems = new vscode.CompletionList();
            const line = doc.getText(new vscode.Range(doc.lineAt(position).range.start, position));
            const ISLIBRARY_LITERAL = /library\s*("|')$/gi;
            if (ISLIBRARY_LITERAL.test(line)) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
                if (workspaceFolder) {
                    const searchPath = getSearchPath(workspaceFolder);
                    for (const [uri, lib] of GlobalLibraries) {
                        if (uri.fsPath.indexOf(searchPath.fsPath) === 0) {
                            const parsedPath = path.parse(uri.fsPath.substring(searchPath.fsPath.length + 1));
                            const libPath = path.join(parsedPath.dir, parsedPath.name);
                            const itemLabel = {
                                label: libPath,
                                detail: parsedPath.ext
                            };
                            completionItems.items.push({
                                label: itemLabel
                            });
                        }
                    }
                }
            }
            return completionItems;
        }
    }, "\"", "'");
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position) => {
            const completionItems = [];
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
            if (workspaceFolder) {
                const config = ProjectConfigs.get(workspaceFolder);
                if (config?.globalIncludes) {
                    for (const globalInclude of config.globalIncludes) {
                        const searchPath = getSearchPath(workspaceFolder);
                        const globalUri = vscode.Uri.file(path.join(searchPath.fsPath, globalInclude));
                        for (const [uri, lib] of GlobalLibraries) {
                            if (uri.toString() !== doc.uri.toString() && globalUri.toString() === uri.toString()) {
                                for (const fn of lib) {
                                    completionItems.push({
                                        kind: vscode_languageclient_1.CompletionItemKind.Function,
                                        label: {
                                            label: fn.name,
                                            detail: ' (library function)',
                                            description: path.basename(uri.fsPath)
                                        },
                                        detail: `(library function) ${fn.name}${fn.generateSignature()}`,
                                        documentation: new vscode.MarkdownString(fn.getAllDocs())
                                    });
                                }
                            }
                        }
                    }
                }
            }
            const userFunctions = parseFunctionsFromSource(doc.getText(), false);
            if (userFunctions) {
                for (let fnIndex = 0; fnIndex < userFunctions.length; fnIndex++) {
                    const fn = userFunctions[fnIndex];
                    completionItems.push({
                        kind: vscode_languageclient_1.CompletionItemKind.Function,
                        label: {
                            label: fn.name,
                            detail: ' (local function)'
                        },
                        detail: `(local function) ${fn.name}${fn.generateSignature()}`,
                        documentation: new vscode.MarkdownString(fn.getAllDocs())
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
function getSearchPath(workspaceFolder) {
    const config = ProjectConfigs.get(workspaceFolder);
    const searchPath = workspaceFolder.uri;
    if (config !== undefined && config.searchPath !== undefined) {
        return vscode.Uri.joinPath(searchPath, config.searchPath.replace("\\", "/"));
    }
    else {
        return workspaceFolder.uri;
    }
}
const FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][^/]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))/gi;
const PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi;
const LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g;
function parseFunctionsFromSource(sourceText, librariesOnly = true) {
    let functions = null;
    let matches = sourceText.matchAll(FIND_COMMENTS_AND_FUNCTIONS);
    for (const match of matches) {
        if (match.groups?.name && (!librariesOnly || match.groups?.isLibrary)) {
            const lib = new functions_1.UserFunction(match.groups.name);
            let fnDoc;
            if (match.groups.comments) {
                fnDoc = DocComment_1.DocComment.parse(match.groups.comments);
                lib.documentation = fnDoc.text;
            }
            if (match.groups.params) {
                lib.params = [];
                // remove line continuations
                const params = match.groups.params.replace(LINE_CONTINUATIONS, "");
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
            functions = functions ?? [];
            functions.push(lib);
        }
    }
    return functions;
}
const ProjectConfigs = new Map();
const GlobalLibraries = new Map();
const SOURCE_GLOB = '**/*.{brs,wbs}';
/**
 * Sets up monitoring of project configuration
 * @param context extension context
 */
function activateWorkspaceFolders(context) {
    const folderDisposables = new Map();
    vscode.workspace.onDidChangeWorkspaceFolders(async ({ added, removed }) => {
        if (added) {
            for (let workspaceFolder of added) {
                folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder));
            }
            ;
        }
        if (removed) {
            for (let workspaceFolder of removed) {
                folderDisposables.get(workspaceFolder)?.forEach(d => d.dispose());
                folderDisposables.delete(workspaceFolder);
            }
        }
    });
    if (vscode.workspace.workspaceFolders) {
        vscode.workspace.workspaceFolders.forEach(async (workspaceFolder) => {
            folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder));
        });
    }
}
async function getProjectConfig(workspaceFolder) {
    let projectFileUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"));
    let projectConfig = null;
    try {
        let projectConfigText = await vscode.workspace.fs.readFile(projectFileUri);
        projectConfig = {};
        if (projectConfigText) {
            projectConfig = JSON.parse(projectConfigText.toString());
            // if (projectConfig?.globalIncludes?.length){
            // 	for (const globalInclude of projectConfig.globalIncludes) {
            // 		const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, globalInclude))
            // 		const globalLib = GlobalLibraries.get(uri)
            // 		if (globalLib){
            // 			if (!projectConfig.libraries) projectConfig.libraries = new Map()
            // 			const globalLib = GlobalLibraries.get(uri)
            // 			projectConfig.libraries.set(uri, globalLib ?? [])
            // 		}
            // 		// if (projectConfig?.libraries) await updateLibraryFunctions(uri)
            // 	}
            // }					
        }
    }
    catch (error) {
        console.log('no project file in workspace');
    }
    return projectConfig;
}
async function updateLibraryFunctions(uri) {
    let libs = null;
    try {
        let libText = await vscode.workspace.fs.readFile(uri);
        if (libText) {
            libs = parseFunctionsFromSource(libText.toString());
        }
    }
    catch {
        vscode.window.showWarningMessage(`Global library not found ${uri.fsPath}`);
    }
    return libs;
}
function updateWorkspaceCode(uri, workspaceFolder) {
}
async function startWatchingSource(workspaceFolder) {
    const watchers = [];
    const projectConfig = await getProjectConfig(workspaceFolder);
    if (projectConfig) {
        ProjectConfigs.set(workspaceFolder, projectConfig);
        const folderPattern = new vscode.RelativePattern(workspaceFolder, SOURCE_GLOB);
        const sourceFiles = await vscode.workspace.findFiles(folderPattern);
        for (const source of sourceFiles) {
            const sourceLibs = await updateLibraryFunctions(source);
            if (sourceLibs) {
                GlobalLibraries.set(source, sourceLibs);
            }
        }
        const codeWatcher = vscode.workspace.createFileSystemWatcher(folderPattern);
        codeWatcher.onDidChange(async (source) => {
            const sourceLibs = await updateLibraryFunctions(source);
            if (sourceLibs) {
                for (const [uri] of GlobalLibraries) {
                    if (uri.toString() === source.toString()) {
                        GlobalLibraries.set(uri, sourceLibs);
                    }
                }
            }
        }, undefined, watchers);
        codeWatcher.onDidDelete(async (source) => {
            for (const [uri] of GlobalLibraries) {
                if (uri.toString() === source.toString()) {
                    GlobalLibraries.delete(uri);
                }
            }
        });
        codeWatcher.onDidCreate(async (source) => {
            const sourceLibs = await updateLibraryFunctions(source);
            if (sourceLibs) {
                GlobalLibraries.set(source, sourceLibs);
            }
        });
    }
    return watchers;
}
async function startWatchingWorkpaceFolder(context, workspaceFolder) {
    const disposables = [];
    const projectFilePattern = new vscode.RelativePattern(workspaceFolder, "br-project.json");
    const projectWatcher = vscode.workspace.createFileSystemWatcher(projectFilePattern);
    let watchers = [];
    projectWatcher.onDidChange(async (uri) => {
        const projectConfig = await getProjectConfig(workspaceFolder);
        if (projectConfig) {
            ProjectConfigs.set(workspaceFolder, projectConfig);
        }
    }, undefined, disposables);
    projectWatcher.onDidDelete((uri) => {
        ProjectConfigs.delete(workspaceFolder);
        watchers.forEach(d => d.dispose());
        watchers = [];
    }, undefined, disposables);
    projectWatcher.onDidCreate(async (uri) => {
        watchers = await startWatchingSource(workspaceFolder);
    }, undefined, disposables);
    watchers = await startWatchingSource(workspaceFolder);
    return disposables.concat(watchers);
}
//# sourceMappingURL=extension.js.map