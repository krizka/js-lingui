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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.createCompiledCatalog = void 0;
const t = __importStar(require("@babel/types"));
const generator_1 = __importDefault(require("@babel/generator"));
const compileMessage_1 = require("@lingui/message-utils/compileMessage");
const pseudoLocalize_1 = __importDefault(require("./pseudoLocalize"));
function createCompiledCatalog(locale, messages, options) {
    const { strict = false, namespace = "cjs", pseudoLocale, compilerBabelOptions = {}, } = options;
    const shouldPseudolocalize = locale === pseudoLocale;
    const compiledMessages = Object.keys(messages).reduce((obj, key) => {
        // Don't use `key` as a fallback translation in strict mode.
        const translation = (messages[key] || (!strict ? key : ""));
        obj[key] = compile(translation, shouldPseudolocalize);
        return obj;
    }, {});
    if (namespace === "json") {
        return JSON.stringify({ messages: compiledMessages });
    }
    const ast = buildExportStatement(
    //build JSON.parse(<compiledMessages>) statement
    t.callExpression(t.memberExpression(t.identifier("JSON"), t.identifier("parse")), [t.stringLiteral(JSON.stringify(compiledMessages))]), namespace);
    const code = (0, generator_1.default)(ast, Object.assign({ minified: true, jsescOption: {
            minimal: true,
        } }, compilerBabelOptions)).code;
    return "/*eslint-disable*/" + code;
}
exports.createCompiledCatalog = createCompiledCatalog;
function buildExportStatement(expression, namespace) {
    if (namespace === "es" || namespace === "ts") {
        // export const messages = { message: "Translation" }
        return t.exportNamedDeclaration(t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier("messages"), expression),
        ]));
    }
    else {
        let exportExpression = null;
        const matches = namespace.match(/^(window|global)\.([^.\s]+)$/);
        if (namespace === "cjs") {
            // module.exports.messages = { message: "Translation" }
            exportExpression = t.memberExpression(t.identifier("module"), t.identifier("exports"));
        }
        else if (matches) {
            // window.i18nMessages = { messages: { message: "Translation" }}
            exportExpression = t.memberExpression(t.identifier(matches[1]), t.identifier(matches[2]));
        }
        else {
            throw new Error(`Invalid namespace param: "${namespace}"`);
        }
        return t.expressionStatement(t.assignmentExpression("=", exportExpression, t.objectExpression([
            t.objectProperty(t.identifier("messages"), expression),
        ])));
    }
}
/**
 * Compile string message into AST tree. Message format is parsed/compiled into
 * JS arrays, which are handled in client.
 */
function compile(message, shouldPseudolocalize = false) {
    return (0, compileMessage_1.compileMessage)(message, (value) => shouldPseudolocalize ? (0, pseudoLocalize_1.default)(value) : value);
}
exports.compile = compile;
