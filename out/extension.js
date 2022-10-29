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
const common_1 = require("./util/common");
const ConfiguredProject_1 = require("./class/ConfiguredProject");
const SourceLibrary_1 = require("./class/SourceLibrary");
const SignatureHelpProvider_1 = require("./providers/SignatureHelpProvider");
const SOURCE_GLOB = '**/*.{brs,wbs}';
const ConfiguredProjects = new Map();
const signatureHelpProvider = new SignatureHelpProvider_1.BrSignatureHelpProvider(ConfiguredProjects);
function activate(context) {
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
    (0, client_1.activateClient)(context);
    activateWorkspaceFolders(context);
    vscode.languages.registerSignatureHelpProvider({
        language: "br",
        scheme: "file"
    }, signatureHelpProvider, "(", ",");
    vscode.languages.registerHoverProvider({
        language: "br",
        scheme: "file"
    }, {
        provideHover: (doc, position, token) => {
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
                                if (fn.name.toLowerCase() == word) {
                                    const hover = (0, common_1.createHoverFromFunction)(fn);
                                    hover.range = wordRange;
                                    return hover;
                                }
                            }
                            // library functions
                            const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
                            if (workspaceFolder) {
                                const project = ConfiguredProjects.get(workspaceFolder);
                                if (project) {
                                    for (const [uri, lib] of project.libraries) {
                                        for (const fn of lib.libraryList) {
                                            if (fn.name.toLowerCase() === word) {
                                                const hover = (0, common_1.createHoverFromFunction)(fn);
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
                                const hover = (0, common_1.createHoverFromFunction)(fn);
                                hover.range = wordRange;
                                return hover;
                            }
                        }
                    }
                    // local functions
                }
            }
        }
    });
    vscode.languages.registerCompletionItemProvider({
        language: "br",
        scheme: "file"
    }, {
        provideCompletionItems: (doc, position, token, context) => {
            const completionItems = new vscode.CompletionList();
            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
                const line = doc.getText(new vscode.Range(doc.lineAt(position).range.start, position));
                const ISLIBRARY_LINKAGE_LIST = /library(\s+(release\s*,)?(\s*nofiles\s*,)?\s*(?<libPath>"[\w\\]+"|'[\w\\]+')?)\s*:\s*(?<fnList>[a-z_, $]*)?$/i;
                let match = line.match(ISLIBRARY_LINKAGE_LIST);
                if (match?.groups) {
                    const libPath = match.groups.libPath.replace(/'|"/g, '');
                    const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
                    if (workspaceFolder) {
                        const project = ConfiguredProjects.get(workspaceFolder);
                        if (project) {
                            for (const [uri, lib] of project.libraries) {
                                if (lib.linkPath?.toLowerCase() == libPath.toLowerCase()) {
                                    for (const fn of lib.libraryList) {
                                        if (match.groups.fnList) {
                                            const lineSearch = new RegExp("\\b" + fn.name.replace("$", "\\$") + "(,|\s|$)", "i");
                                            if (!lineSearch.test(match.groups.fnList)) {
                                                completionItems.items.push({
                                                    label: fn.name
                                                });
                                            }
                                        }
                                        else {
                                            completionItems.items.push({
                                                label: fn.name
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
            const ISLIBRARY_LITERAL = /library\s+(release\s*,)?(\s*nofiles\s*,)?\s*("|')$/gi;
            if (ISLIBRARY_LITERAL.test(line)) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
                if (workspaceFolder) {
                    const project = ConfiguredProjects.get(workspaceFolder);
                    if (project) {
                        const searchPath = (0, common_1.getSearchPath)(workspaceFolder, project);
                        for (const [uri, lib] of project.libraries) {
                            if (lib.uri.fsPath.indexOf(searchPath.fsPath) === 0) {
                                const parsedPath = path.parse(lib.uri.fsPath.substring(searchPath.fsPath.length + 1));
                                const libPath = path.join(parsedPath.dir, parsedPath.name);
                                const itemLabel = {
                                    label: libPath,
                                    detail: parsedPath.ext.substring(0, parsedPath.ext.length - 1)
                                };
                                completionItems.items.push({
                                    label: itemLabel
                                });
                            }
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
                const project = ConfiguredProjects.get(workspaceFolder);
                if (project) {
                    for (const [uri, lib] of project.libraries) {
                        if (uri !== doc.uri.toString()) {
                            for (const fn of lib.libraryList) {
                                if (fn.isLibrary) {
                                    completionItems.push({
                                        kind: vscode_languageclient_1.CompletionItemKind.Function,
                                        label: {
                                            label: fn.name,
                                            detail: ' (library function)',
                                            description: path.basename(lib.uri.fsPath)
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
            const source = new SourceLibrary_1.SourceLibrary(doc.uri, doc.getText());
            for (const fn of source.libraryList) {
                completionItems.push({
                    kind: vscode_languageclient_1.CompletionItemKind.Function,
                    label: {
                        label: fn.name,
                        detail: ` (${fn.isLibrary ? 'library' : 'local'} function)`
                    },
                    detail: `(${fn.isLibrary ? 'library' : 'local'} function) ${fn.name}${fn.generateSignature()}`,
                    documentation: new vscode.MarkdownString(fn.getAllDocs())
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
        }
    }
    catch (error) {
        console.log('no project file in workspace');
    }
    return projectConfig;
}
async function updateLibraryFunctions(uri) {
    try {
        const libText = await vscode.workspace.fs.readFile(uri);
        if (libText) {
            const newDoc = new SourceLibrary_1.SourceLibrary(uri, libText.toString());
            return newDoc;
        }
    }
    catch {
        vscode.window.showWarningMessage(`Library source not found ${uri.fsPath}`);
    }
}
async function startWatchingSource(workspaceFolder, project) {
    const watchers = [];
    const folderPattern = new vscode.RelativePattern(workspaceFolder, SOURCE_GLOB);
    const sourceFiles = await vscode.workspace.findFiles(folderPattern);
    for (const source of sourceFiles) {
        const sourceLib = await updateLibraryFunctions(source);
        if (sourceLib) {
            project.libraries.set(source.toString(), sourceLib);
        }
    }
    const codeWatcher = vscode.workspace.createFileSystemWatcher(folderPattern);
    codeWatcher.onDidChange(async (sourceUri) => {
        const sourceLib = await updateLibraryFunctions(sourceUri);
        if (sourceLib) {
            for (const [uri] of project.libraries) {
                if (uri === sourceUri.toString()) {
                    project.libraries.set(sourceUri.toString(), sourceLib);
                }
            }
        }
    }, undefined, watchers);
    codeWatcher.onDidDelete(async (sourceUri) => {
        project.libraries.delete(sourceUri.toString());
    });
    codeWatcher.onDidCreate(async (sourceUri) => {
        const sourceLib = await updateLibraryFunctions(sourceUri);
        if (sourceLib) {
            project.libraries.set(sourceUri.toString(), sourceLib);
        }
    });
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
            const project = new ConfiguredProject_1.ConfiguredProject(projectConfig);
            ConfiguredProjects.set(workspaceFolder, project);
        }
    }, undefined, disposables);
    projectWatcher.onDidDelete((uri) => {
        ConfiguredProjects.delete(workspaceFolder);
        watchers.forEach(d => d.dispose());
        watchers = [];
    }, undefined, disposables);
    projectWatcher.onDidCreate(async (uri) => {
        const projectConfig = await getProjectConfig(workspaceFolder);
        if (projectConfig) {
            const project = new ConfiguredProject_1.ConfiguredProject(projectConfig);
            ConfiguredProjects.set(workspaceFolder, project);
            watchers = await startWatchingSource(workspaceFolder, project);
        }
    }, undefined, disposables);
    const projectConfig = await getProjectConfig(workspaceFolder);
    if (projectConfig) {
        const project = new ConfiguredProject_1.ConfiguredProject(projectConfig);
        ConfiguredProjects.set(workspaceFolder, project);
        watchers = await startWatchingSource(workspaceFolder, project);
    }
    return disposables.concat(watchers);
}
//# sourceMappingURL=extension.js.map