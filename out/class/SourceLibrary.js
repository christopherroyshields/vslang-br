"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceLibrary = void 0;
const path = require("path");
const common_1 = require("../util/common");
class SourceLibrary {
    constructor(uri, libraryList, workspaceFolder, project) {
        this.uri = uri;
        this.libraryList = libraryList;
        this.linkPath = this.getLinkPath(workspaceFolder, project);
    }
    getLinkPath(workspaceFolder, project) {
        const searchPath = (0, common_1.getSearchPath)(workspaceFolder, project);
        const parsedPath = path.parse(this.uri.fsPath.substring(searchPath.fsPath.length + 1));
        const libPath = path.join(parsedPath.dir, parsedPath.name);
        return libPath;
    }
}
exports.SourceLibrary = SourceLibrary;
//# sourceMappingURL=SourceLibrary.js.map