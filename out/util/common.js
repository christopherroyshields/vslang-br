"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchPath = exports.stripBalancedFunctions = exports.isComment = exports.FUNCTION_CALL_CONTEXT = exports.STRING_LITERALS = void 0;
const vscode_1 = require("vscode");
exports.STRING_LITERALS = /(}}.*?({{|$)|`.*?({{|$)|}}.*?(`|$)|\"(?:[^\"]|"")*(\"|$)|'(?:[^\']|'')*('|$)|`(?:[^\`]|``)*(`|b))/g;
exports.FUNCTION_CALL_CONTEXT = /(?<isDef>def\s+)?(?<name>[a-zA-Z][a-zA-Z0-9_]*?\$?)\((?<params>[^(]*)?$/i;
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