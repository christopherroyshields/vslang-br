"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceLibrary = void 0;
const path = require("path");
const vscode_1 = require("vscode");
const BrParamType_1 = require("../types/BrParamType");
const DocComment_1 = require("../types/DocComment");
const common_1 = require("../util/common");
const UserFunction_1 = require("./UserFunction");
const UserFunctionParameter_1 = require("./UserFunctionParameter");
class SourceLibrary {
    constructor(uri, text, project) {
        this.uri = uri;
        this.libraryList = this.parseFunctionsFromSource(text);
        if (project) {
            const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(this.uri);
            if (workspaceFolder) {
                this.linkPath = this.getLinkPath(workspaceFolder, project);
            }
        }
    }
    getLinkPath(workspaceFolder, project) {
        const searchPath = (0, common_1.getSearchPath)(workspaceFolder, project);
        const parsedPath = path.parse(this.uri.fsPath.substring(searchPath.fsPath.length + 1));
        const libPath = path.join(parsedPath.dir, parsedPath.name);
        return libPath;
    }
    parseFunctionsFromSource(sourceText) {
        const functions = [];
        let matches = sourceText.matchAll(SourceLibrary.FIND_COMMENTS_AND_FUNCTIONS);
        for (const match of matches) {
            if (match.groups?.name) {
                const isLib = match.groups?.isLibrary ? true : false;
                const lib = new UserFunction_1.UserFunction(match.groups.name, isLib);
                let fnDoc;
                if (match.groups.comments) {
                    fnDoc = DocComment_1.DocComment.parse(match.groups.comments);
                    lib.documentation = fnDoc.text;
                }
                if (match.groups.params) {
                    lib.params = [];
                    // remove line continuations
                    const params = match.groups.params.replace(SourceLibrary.LINE_CONTINUATIONS, "");
                    const it = params.matchAll(SourceLibrary.PARAM_SEARCH);
                    let isOptional = false;
                    for (const paramMatch of it) {
                        if (paramMatch.groups && paramMatch.groups.name) {
                            if (paramMatch.groups.name.trim() == "___") {
                                break;
                            }
                            const libParam = new UserFunctionParameter_1.UserFunctionParameter();
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
        }
        return functions;
    }
}
exports.SourceLibrary = SourceLibrary;
SourceLibrary.PARAM_SEARCH = /(?<isReference>&\s*)?(?<name>(?<isArray>mat\s+)?[\w]+(?<isString>\$)?)(?:\s*)(?:\*\s*(?<length>\d+))?\s*(?<delimiter>;|,)?/gi;
SourceLibrary.LINE_CONTINUATIONS = /\s*!_.*(\r\n|\n)\s*/g;
SourceLibrary.FIND_COMMENTS_AND_FUNCTIONS = /(?:(?<string_or_comment>\/\*[^*][^/]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(?:`|$)|\"(?:[^\"]|"")*(?:\"|$)|'(?:[^\']|'')*(?:'|$)|`(?:[^\`]|``)*(?:`|b))|(?:(?:(?:\/\*(?<comments>[\s\S]*?)\*\/)\s*)?(\n\s*\d+\s+)?\bdef\s+(?:(?<isLibrary>library)\s+)?(?<name>\w*\$?)(\*\d+)?(?:\((?<params>[!&\w$, ;*\r\n\t]+)\))?))/gi;
//# sourceMappingURL=SourceLibrary.js.map