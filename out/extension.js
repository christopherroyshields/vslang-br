"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const lexi_1 = require("./lexi");
const next_prev_1 = require("./next-prev");
const client_1 = require("./client");
const statements_1 = require("./statements");
const path = require("path");
const ConfiguredProject_1 = require("./class/ConfiguredProject");
const SourceLibrary_1 = require("./class/SourceLibrary");
const BrSignatureHelpProvider_1 = require("./providers/BrSignatureHelpProvider");
const BrHoverProvider_1 = require("./providers/BrHoverProvider");
const LibLinkListProvider_1 = require("./providers/LibLinkListProvider");
const LibPathProvider_1 = require("./providers/LibPathProvider");
const FuncCompletionProvider_1 = require("./providers/FuncCompletionProvider");
const SOURCE_GLOB = '**/*.{brs,wbs}';
const ConfiguredProjects = new Map();
const signatureHelpProvider = new BrSignatureHelpProvider_1.BrSignatureHelpProvider(ConfiguredProjects);
const hoverProvider = new BrHoverProvider_1.BrHoverProvider(ConfiguredProjects);
const libLinkListProvider = new LibLinkListProvider_1.LibLinkListProvider(ConfiguredProjects);
const libPathProvider = new LibPathProvider_1.LibPathProvider(ConfiguredProjects);
const funcCompletionProvider = new FuncCompletionProvider_1.FuncCompletionProvider(ConfiguredProjects);
function activate(context) {
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
    (0, client_1.activateClient)(context);
    activateWorkspaceFolders(context);
    const sel = {
        language: "br"
    };
    vscode.languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ",");
    vscode.languages.registerHoverProvider(sel, hoverProvider);
    vscode.languages.registerCompletionItemProvider(sel, libLinkListProvider, ":", ",", " ");
    vscode.languages.registerCompletionItemProvider(sel, libPathProvider, "\"", "'");
    vscode.languages.registerCompletionItemProvider(sel, funcCompletionProvider);
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
async function updateLibraryFunctions(uri, project) {
    try {
        const libText = await vscode.workspace.fs.readFile(uri);
        if (libText) {
            const newDoc = new SourceLibrary_1.SourceLibrary(uri, libText.toString(), project);
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
        const sourceLib = await updateLibraryFunctions(source, project);
        if (sourceLib) {
            project.libraries.set(source.toString(), sourceLib);
        }
    }
    const codeWatcher = vscode.workspace.createFileSystemWatcher(folderPattern);
    codeWatcher.onDidChange(async (sourceUri) => {
        const sourceLib = await updateLibraryFunctions(sourceUri, project);
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
        const sourceLib = await updateLibraryFunctions(sourceUri, project);
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