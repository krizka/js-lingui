"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const babel_1 = __importDefault(require("./babel"));
const DEFAULT_EXTRACTORS = [babel_1.default];
async function extract(filename, onMessageExtracted, linguiConfig, options) {
    var _a;
    const extractorsToExtract = (_a = options.extractors) !== null && _a !== void 0 ? _a : DEFAULT_EXTRACTORS;
    for (let e of extractorsToExtract) {
        let ext = e;
        if (typeof e === "string") {
            // in case of the user using require.resolve in their extractors, we require that module
            ext = require(e);
        }
        if (ext.default) {
            ext = ext.default;
        }
        if (!ext.match(filename))
            continue;
        try {
            const file = await promises_1.default.readFile(filename);
            await ext.extract(filename, file.toString(), onMessageExtracted, {
                linguiConfig,
            });
            return true;
        }
        catch (e) {
            console.error(`Cannot process file ${filename} ${e.message}`);
            console.error(e.stack);
            return false;
        }
    }
    return true;
}
exports.default = extract;
