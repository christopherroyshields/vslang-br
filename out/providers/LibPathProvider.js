"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibPathProvider = void 0;
const path = require("path");
const vscode_1 = require("vscode");
const common_1 = require("../util/common");
const BaseCompletionProvider_1 = require("./BaseCompletionProvider");
/**
 * Library statement file path provider
 */
class LibPathProvider extends BaseCompletionProvider_1.BaseCompletionProvider {
    constructor(configuredProjects) {
        super(configuredProjects);
    }
    provideCompletionItems(doc, position, token, context) {
        const completionItems = new vscode_1.CompletionList();
        const line = doc.getText(new vscode_1.Range(doc.lineAt(position).range.start, position));
        const ISLIBRARY_LITERAL = /library\s+(release\s*,)?(\s*nofiles\s*,)?\s*("|')$/gi;
        if (ISLIBRARY_LITERAL.test(line)) {
            const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
            if (workspaceFolder) {
                const project = this.configuredProjects.get(workspaceFolder);
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
}
exports.LibPathProvider = LibPathProvider;
//# sourceMappingURL=LibPathProvider.js.map