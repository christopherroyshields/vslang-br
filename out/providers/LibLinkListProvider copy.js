"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibLinkListProvider = void 0;
const vscode_1 = require("vscode");
const BaseCompletionProvider_1 = require("./BaseCompletionProvider");
/**
 * Library statement linkage list completion provider
 */
class LibLinkListProvider extends BaseCompletionProvider_1.BaseCompletionProvider {
    constructor(configuredProjects) {
        super(configuredProjects);
    }
    provideCompletionItems(doc, position, token, context) {
        const completionItems = new vscode_1.CompletionList();
        if (context.triggerKind === vscode_1.CompletionTriggerKind.TriggerCharacter) {
            const line = doc.getText(new vscode_1.Range(doc.lineAt(position).range.start, position));
            const ISLIBRARY_LINKAGE_LIST = /library(\s+(release\s*,)?(\s*nofiles\s*,)?\s*(?<libPath>"[\w\\]+"|'[\w\\]+')?)\s*:\s*(?<fnList>[a-z_, $]*)?$/i;
            let match = line.match(ISLIBRARY_LINKAGE_LIST);
            if (match?.groups) {
                const libPath = match.groups.libPath.replace(/'|"/g, '');
                const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
                if (workspaceFolder) {
                    const project = this.configuredProjects.get(workspaceFolder);
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
}
exports.LibLinkListProvider = LibLinkListProvider;
//# sourceMappingURL=LibLinkListProvider%20copy.js.map