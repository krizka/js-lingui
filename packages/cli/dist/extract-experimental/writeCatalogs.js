"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTemplate = exports.writeCatalogs = void 0;
const resolveTemplatePath_1 = require("./resolveTemplatePath");
const chalk_1 = __importDefault(require("chalk"));
const resolveCatalogPath_1 = require("./resolveCatalogPath");
const mergeCatalog_1 = require("../api/catalog/mergeCatalog");
const stats_1 = require("../api/stats");
const catalog_1 = require("../api/catalog");
function cleanAndSort(catalog, clean, orderBy) {
    if (clean) {
        catalog = (0, catalog_1.cleanObsolete)(catalog);
    }
    return (0, catalog_1.order)(orderBy)(catalog);
}
async function writeCatalogs(params) {
    const { entryPoint, outputPattern, linguiConfig, locales, overwrite, format, clean, messages, } = params;
    const stat = {};
    for (const locale of locales) {
        const catalogOutput = (0, resolveCatalogPath_1.resolveCatalogPath)(outputPattern, entryPoint, linguiConfig.rootDir, locale, format.getCatalogExtension());
        const catalog = (0, mergeCatalog_1.mergeCatalog)(await format.read(catalogOutput, locale), messages, locale === linguiConfig.sourceLocale, { overwrite });
        await format.write(catalogOutput, cleanAndSort(catalog, clean, linguiConfig.orderBy), locale);
        stat[locale] = catalog;
    }
    return {
        statMessage: (0, stats_1.printStats)(linguiConfig, stat).toString(),
    };
}
exports.writeCatalogs = writeCatalogs;
async function writeTemplate(params) {
    const { entryPoint, outputPattern, linguiConfig, format, clean, messages } = params;
    const catalogOutput = (0, resolveTemplatePath_1.resolveTemplatePath)(entryPoint, outputPattern, linguiConfig.rootDir, format.getTemplateExtension());
    await format.write(catalogOutput, cleanAndSort(messages, clean, linguiConfig.orderBy), undefined);
    return {
        statMessage: `${chalk_1.default.bold(Object.keys(messages).length)} message(s) extracted`,
    };
}
exports.writeTemplate = writeTemplate;
