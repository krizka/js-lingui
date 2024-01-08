"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntryPoints = void 0;
const glob_1 = __importDefault(require("glob"));
function getEntryPoints(entries) {
    const patterns = entries.length > 1 ? `{${entries.join(",")}}` : entries[0];
    return glob_1.default.sync(patterns, { mark: true });
}
exports.getEntryPoints = getEntryPoints;
