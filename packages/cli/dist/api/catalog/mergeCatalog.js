"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCatalog = void 0;
const R = __importStar(require("ramda"));
function mergeCatalog(prevCatalog, nextCatalog, forSourceLocale, options) {
    const nextKeys = Object.keys(nextCatalog);
    const prevKeys = R.keys(prevCatalog).map(String);
    const newKeys = R.difference(nextKeys, prevKeys);
    const mergeKeys = R.intersection(nextKeys, prevKeys);
    const obsoleteKeys = R.difference(prevKeys, nextKeys);
    // Initialize new catalog with new keys
    const newMessages = R.mapObjIndexed((message, key) => (Object.assign({ translation: forSourceLocale ? message.message || key : "" }, message)), R.pick(newKeys, nextCatalog));
    // Merge translations from previous catalog
    const mergedMessages = mergeKeys.map((key) => {
        const updateFromDefaults = forSourceLocale &&
            (prevCatalog[key].translation === prevCatalog[key].message ||
                options.overwrite);
        const translation = updateFromDefaults
            ? nextCatalog[key].message || key
            : prevCatalog[key].translation;
        return {
            [key]: Object.assign({ translation }, R.omit(["obsolete, translation"], nextCatalog[key])),
        };
    });
    // Mark all remaining translations as obsolete
    // Only if *options.files* is not provided
    const obsoleteMessages = obsoleteKeys.map((key) => ({
        [key]: Object.assign(Object.assign({}, prevCatalog[key]), { obsolete: !options.files }),
    }));
    return R.mergeAll([newMessages, ...mergedMessages, ...obsoleteMessages]);
}
exports.mergeCatalog = mergeCatalog;
