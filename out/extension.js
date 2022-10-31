"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const lexi_1 = require("./lexi");
const next_prev_1 = require("./next-prev");
const client_1 = require("./client");
const path = require("path");
const ConfiguredProject_1 = require("./class/ConfiguredProject");
const SourceLibrary_1 = require("./class/SourceLibrary");
const BrSignatureHelpProvider_1 = require("./providers/BrSignatureHelpProvider");
const BrHoverProvider_1 = require("./providers/BrHoverProvider");
const LibLinkListProvider_1 = require("./providers/LibLinkListProvider");
const LibPathProvider_1 = require("./providers/LibPathProvider");
const FuncCompletionProvider_1 = require("./providers/FuncCompletionProvider");
const StatementCompletionProvider_1 = require("./providers/StatementCompletionProvider");
const vscode_1 = require("vscode");
const BrSymbolProvider_1 = require("./providers/BrSymbolProvider");
const SOURCE_GLOB = '**/*.{brs,wbs}';
const ConfiguredProjects = new Map();
const signatureHelpProvider = new BrSignatureHelpProvider_1.BrSignatureHelpProvider(ConfiguredProjects);
const hoverProvider = new BrHoverProvider_1.BrHoverProvider(ConfiguredProjects);
const libLinkListProvider = new LibLinkListProvider_1.LibLinkListProvider(ConfiguredProjects);
const libPathProvider = new LibPathProvider_1.LibPathProvider(ConfiguredProjects);
const funcCompletionProvider = new FuncCompletionProvider_1.FuncCompletionProvider(ConfiguredProjects);
const statementCompletionProvider = new StatementCompletionProvider_1.StatementCompletionProvider(ConfiguredProjects);
const brSourceSymbolProvider = new BrSymbolProvider_1.BrSourceSymbolProvider();
function activate(context) {
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
    (0, client_1.activateClient)(context);
    activateWorkspaceFolders(context);
    const sel = {
        language: "br"
    };
    vscode_1.languages.registerSignatureHelpProvider(sel, signatureHelpProvider, "(", ",");
    vscode_1.languages.registerHoverProvider(sel, hoverProvider);
    vscode_1.languages.registerCompletionItemProvider(sel, libLinkListProvider, ":", ",", " ");
    vscode_1.languages.registerCompletionItemProvider(sel, libPathProvider, "\"", "'");
    vscode_1.languages.registerCompletionItemProvider(sel, funcCompletionProvider);
    vscode_1.languages.registerCompletionItemProvider(sel, statementCompletionProvider);
    vscode_1.languages.registerDocumentSymbolProvider(sel, brSourceSymbolProvider);
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
    vscode_1.workspace.onDidChangeWorkspaceFolders(async ({ added, removed }) => {
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
    if (vscode_1.workspace.workspaceFolders) {
        vscode_1.workspace.workspaceFolders.forEach(async (workspaceFolder) => {
            folderDisposables.set(workspaceFolder, await startWatchingWorkpaceFolder(context, workspaceFolder));
        });
    }
}
async function getProjectConfig(workspaceFolder) {
    let projectFileUri = vscode_1.Uri.file(path.join(workspaceFolder.uri.fsPath, "br-project.json"));
    let projectConfig = null;
    try {
        let projectConfigText = await vscode_1.workspace.fs.readFile(projectFileUri);
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
        const libText = await vscode_1.workspace.fs.readFile(uri);
        if (libText) {
            const newDoc = new SourceLibrary_1.SourceLibrary(uri, libText.toString(), project);
            return newDoc;
        }
    }
    catch {
        vscode_1.window.showWarningMessage(`Library source not found ${uri.fsPath}`);
    }
}
async function startWatchingSource(workspaceFolder, project) {
    const watchers = [];
    const folderPattern = new vscode_1.RelativePattern(workspaceFolder, SOURCE_GLOB);
    const sourceFiles = await vscode_1.workspace.findFiles(folderPattern);
    for (const source of sourceFiles) {
        const sourceLib = await updateLibraryFunctions(source, project);
        if (sourceLib) {
            project.libraries.set(source.toString(), sourceLib);
        }
    }
    const codeWatcher = vscode_1.workspace.createFileSystemWatcher(folderPattern);
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
    const projectFilePattern = new vscode_1.RelativePattern(workspaceFolder, "br-project.json");
    const projectWatcher = vscode_1.workspace.createFileSystemWatcher(projectFilePattern);
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