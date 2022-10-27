"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHoverFromFunction = exports.isComment = void 0;
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
//# sourceMappingURL=common.js.map