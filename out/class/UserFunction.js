"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFunction = void 0;
const os_1 = require("os");
/**
 * User Defined BR Function found in source
 */
class UserFunction {
    /**
     * @param name - function name
     */
    constructor(name) {
        this.name = name;
    }
    /**
     *
     * @returns A composite of all comment documentation for display purposes for hover and completion
     */
    getAllDocs() {
        let docs;
        if (this.documentation) {
            docs = this.documentation + "\\" + os_1.EOL;
        }
        if (this.params) {
            for (let paramIndex = 0; paramIndex < this.params.length; paramIndex++) {
                const param = this.params[paramIndex];
                if (param.documentation) {
                    if (paramIndex || docs) {
                        docs += "\\" + os_1.EOL;
                    }
                    docs += `*@param* \`${param.name}\` ${param.documentation}`;
                }
            }
        }
        return docs;
    }
    generateSignature() {
        let sig = '';
        if (this.params?.length) {
            sig += '(';
            for (let paramindex = 0; paramindex < this.params.length; paramindex++) {
                if (paramindex > 0) {
                    sig += ',';
                }
                const element = this.params[paramindex];
                let name = '';
                if (element.isReference) {
                    name += '&';
                }
                name += element.name;
                if (element.length) {
                    name += '*' + element.length.toString();
                }
                if (element.isOptional) {
                    name = '[' + name + ']';
                }
                sig += name;
            }
            sig += ')';
        }
        return sig;
    }
}
exports.UserFunction = UserFunction;
//# sourceMappingURL=UserFunction.js.map