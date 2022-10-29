"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrSignatureHelpProvider = void 0;
const vscode_1 = require("vscode");
const SourceLibrary_1 = require("../class/SourceLibrary");
const functions_1 = require("../completions/functions");
const common_1 = require("../util/common");
class BrSignatureHelpProvider {
    constructor(configuredProjects) {
        this.configuredProjects = configuredProjects;
    }
    provideSignatureHelp(doc, position, token, context) {
        let preText = doc.getText(new vscode_1.Range(doc.positionAt(0), position));
        // strip functions with params
        if (preText) {
            // remove literals first
            preText = preText.replace(common_1.STRING_LITERALS, "");
            preText = (0, common_1.stripBalancedFunctions)(preText);
            let context = common_1.FUNCTION_CALL_CONTEXT.exec(preText);
            if (context && context.groups && !context.groups.isDef) {
                const sigHelp = {
                    signatures: [],
                    activeSignature: 0,
                    activeParameter: 0
                };
                if (context.groups.name.substring(0, 2).toLocaleLowerCase() === "fn") {
                    const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(doc.uri);
                    const localLib = new SourceLibrary_1.SourceLibrary(doc.uri, doc.getText());
                    for (const fn of localLib.libraryList) {
                        if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()) {
                            const params = [];
                            if (fn && fn.params) {
                                for (const param of fn.params) {
                                    params.push({
                                        label: param.name,
                                        documentation: param.documentation
                                    });
                                }
                            }
                            const sigInfo = new vscode_1.SignatureInformation(fn.name + (0, functions_1.generateFunctionSignature)(fn), new vscode_1.MarkdownString(fn.documentation));
                            sigInfo.parameters = params;
                            sigInfo.activeParameter = context.groups.params?.split(',').length - 1;
                            sigHelp.signatures.push(sigInfo);
                        }
                    }
                    if (workspaceFolder) {
                        const project = this.configuredProjects.get(workspaceFolder);
                        if (project) {
                            for (const [libUri, lib] of project.libraries) {
                                if (libUri !== doc.uri.toString()) {
                                    for (const fn of lib.libraryList) {
                                        if (fn.name.toLowerCase() == context.groups.name.toLocaleLowerCase()) {
                                            const params = [];
                                            if (fn && fn.params) {
                                                for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
                                                    const el = fn.params[paramIndex];
                                                    params.push({
                                                        label: el.name,
                                                        documentation: el.documentation
                                                    });
                                                }
                                            }
                                            const sigInfo = new vscode_1.SignatureInformation(fn.name + (0, functions_1.generateFunctionSignature)(fn));
                                            sigInfo.parameters = params;
                                            sigInfo.activeParameter = context.groups.params?.split(',').length - 1;
                                            sigHelp.signatures.push(sigInfo);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    const internalFunctions = (0, functions_1.getFunctionsByName)(context.groups.name);
                    if (internalFunctions) {
                        for (const fn of internalFunctions) {
                            let params = [];
                            if (fn && fn.params) {
                                for (let paramIndex = 0; paramIndex < fn.params.length; paramIndex++) {
                                    let el = fn.params[paramIndex];
                                    params.push({
                                        label: el.name,
                                        documentation: el.documentation
                                    });
                                }
                            }
                            sigHelp.signatures.push({
                                label: fn.name + (0, functions_1.generateFunctionSignature)(fn),
                                parameters: params,
                                activeParameter: context.groups.params?.split(',').length - 1
                            });
                        }
                    }
                }
                return sigHelp;
            }
            else {
                // not in function call with parameters
                return;
            }
        }
    }
}
exports.BrSignatureHelpProvider = BrSignatureHelpProvider;
//# sourceMappingURL=BrSignatureHelpProvider.js.map