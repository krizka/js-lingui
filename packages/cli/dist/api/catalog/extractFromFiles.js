"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromFiles = void 0;
const extractors_1 = __importDefault(require("../extractors"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
async function extractFromFiles(paths, config) {
    const messages = {};
    let catalogSuccess = true;
    for (let filename of paths) {
        const fileSuccess = await (0, extractors_1.default)(filename, (next) => {
            if (!messages[next.id]) {
                messages[next.id] = {
                    message: next.message,
                    context: next.context,
                    comments: [],
                    origin: [],
                };
            }
            const prev = messages[next.id];
            // there might be a case when filename was not mapped from sourcemaps
            const filename = next.origin[0]
                ? path_1.default.relative(config.rootDir, next.origin[0]).replace(/\\/g, "/")
                : "";
            const origin = [filename, next.origin[1]];
            if (false && prev.message && next.message && prev.message !== next.message) {
                throw new Error(`Encountered different default translations for message ${chalk_1.default.yellow(next.id)}` +
                    `\n${chalk_1.default.yellow((0, utils_1.prettyOrigin)(prev.origin))} ${prev.message}` +
                    `\n${chalk_1.default.yellow((0, utils_1.prettyOrigin)([origin]))} ${next.message}`);
            }
            messages[next.id] = Object.assign(Object.assign({}, prev), { comments: next.comment
                    ? [...prev.comments, next.comment]
                    : prev.comments, origin: [...prev.origin, [filename, next.origin[1]]] });
        }, config, {
            extractors: config.extractors,
        });
        catalogSuccess && (catalogSuccess = fileSuccess);
    }
    if (!catalogSuccess)
        return undefined;
    return messages;
}
exports.extractFromFiles = extractFromFiles;
