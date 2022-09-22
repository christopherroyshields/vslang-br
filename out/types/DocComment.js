"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocComment = void 0;
class DocComment extends Object {
    constructor() {
        super();
        this.params = new Map();
    }
    /**
     * Function removes leading asterisk from comment lines
     * @param comments
     * @returns comments without asterisk
     */
    static cleanComments(comments) {
        return comments.replace(/^\s*\*\s/gm, "").trim();
    }
    static parse(commentText) {
        const docComment = new DocComment();
        // freeform text at beginning
        const textMatch = DocComment.textSearch.exec(commentText);
        if (textMatch != null) {
            docComment.text = DocComment.cleanComments(textMatch[0]);
        }
        // params
        const tagMatches = commentText.matchAll(DocComment.paramSearch);
        for (const tagMatch of tagMatches) {
            if (tagMatch.groups) {
                docComment.params.set(tagMatch.groups.name, tagMatch.groups.desc);
            }
        }
        return docComment;
    }
}
exports.DocComment = DocComment;
DocComment.textSearch = /^[\s\S]*?(?=@|$)/;
DocComment.paramSearch = /@(?<tag>param)[ \t]+(?<name>(?:mat\s+)?\w+\$?)?(?:[ \t]+(?<desc>.*))?/gmi;
//# sourceMappingURL=DocComment.js.map