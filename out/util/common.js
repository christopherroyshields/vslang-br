"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchPath = exports.stripBalancedFunctions = exports.createHoverFromFunction = exports.isComment = void 0;
const vscode_1 = require("vscode");
const functions_1 = require("../completions/functions");
function isComment(cursorPosition, doctext, doc) {
    let commentMatch;
    const STRING_OR_COMMENT = /(\/\*[\s\S]*?\*\/|!.*|}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g;
    while ((commentMatch = STRING_OR_COMMENT.exec(doctext)) !== null) {
        let startOffset = commentMatch.index;
        let endOffset = commentMatch.index + commentMatch[0].length;
        if (doc.offsetAt(cursorPosition) < startOffset) {
            break;
        }
        if (doc.offsetAt(cursorPosition) >= startOffset) {
            if (doc.offsetAt(cursorPosition) <= endOffset) {
                return true;
            }
        }
    }
    return false;
}
exports.isComment = isComment;
function createHoverFromFunction(fn) {
    let markDownString = '```br\n' + fn.name + (0, functions_1.generateFunctionSignature)(fn) + '\n```\n---';
    if (markDownString) {
        markDownString += '\n' + fn.documentation;
    }
    fn.params?.forEach((param) => {
        if (param.documentation) {
            markDownString += `\r\n * @param \`${param.name}\` ${param.documentation}`;
        }
    });
    let markup = new vscode_1.MarkdownString(markDownString);
    return new vscode_1.Hover(markup);
}
exports.createHoverFromFunction = createHoverFromFunction;
const CONTAINS_BALANCED_FN = /[a-zA-Z][\w]*\$?(\*\d+)?\([^()]*\)/g;
function stripBalancedFunctions(line) {
    if (CONTAINS_BALANCED_FN.test(line)) {
        line = line.replace(CONTAINS_BALANCED_FN, "");
        line = stripBalancedFunctions(line);
    }
    return line;
}
exports.stripBalancedFunctions = stripBalancedFunctions;
function getSearchPath(workspaceFolder, project) {
    const config = project.config;
    const searchPath = workspaceFolder.uri;
    if (config !== undefined && config.searchPath !== undefined) {
        return vscode_1.Uri.joinPath(searchPath, config.searchPath.replace("\\", "/"));
    }
    else {
        return workspaceFolder.uri;
    }
}
exports.getSearchPath = getSearchPath;
//# sourceMappingURL=common.js.map