"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCompletionProvider = void 0;
class BaseCompletionProvider {
    constructor(configuredProjects) {
        this.configuredProjects = configuredProjects;
    }
    provideCompletionItems(document, position, token, context) {
        throw new Error("Method not implemented.");
    }
    resolveCompletionItem(item, token) {
        throw new Error("Method not implemented.");
    }
}
exports.BaseCompletionProvider = BaseCompletionProvider;
//# sourceMappingURL=BaseCompletionProvider.js.map