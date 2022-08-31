"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const lexi_1 = require("./lexi");
const next_prev_1 = require("./next-prev");
function activate(context) {
    console.log('Extension "vslang-br" is now active!');
    (0, lexi_1.activateLexi)(context);
    (0, next_prev_1.activateNextPrev)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map