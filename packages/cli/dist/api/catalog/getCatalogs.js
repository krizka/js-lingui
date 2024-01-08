"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogForFile = exports.getCatalogForMerge = exports.getCatalogs = void 0;
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const catalog_1 = require("../catalog");
const utils_1 = require("../utils");
const micromatch_1 = __importDefault(require("micromatch"));
const formats_1 = require("../formats");
const getExperimentalCatalogs_1 = require("../../extract-experimental/getExperimentalCatalogs");
const NAME_PH = "{name}";
const LOCALE_PH = "{locale}";
/**
 * Parse `config.catalogs` and return a list of configured Catalog instances.
 */
async function getCatalogs(config) {
    var _a, _b;
    const catalogsConfig = config.catalogs;
    const catalogs = [];
    const format = await (0, formats_1.getFormat)(config.format, config.formatOptions, config.sourceLocale);
    catalogsConfig.forEach((catalog) => {
        validateCatalogPath(catalog.path, format.getCatalogExtension());
        const include = ensureArray(catalog.include).map(utils_1.normalizeRelativePath);
        const exclude = ensureArray(catalog.exclude).map(utils_1.normalizeRelativePath);
        // catalog.path without {name} pattern -> always refers to a single catalog
        if (!catalog.path.includes(NAME_PH)) {
            // Validate that sourcePaths doesn't use {name} pattern either
            const invalidSource = include.find((path) => path.includes(NAME_PH));
            if (invalidSource !== undefined) {
                throw new Error(`Catalog with path "${catalog.path}" doesn't have a {name} pattern` +
                    ` in it, but one of source directories uses it: "${invalidSource}".` +
                    ` Either add {name} pattern to "${catalog.path}" or remove it` +
                    ` from all source directories.`);
            }
            catalogs.push(new catalog_1.Catalog({
                name: getCatalogName(catalog.path),
                path: (0, utils_1.normalizeRelativePath)(catalog.path),
                include,
                exclude,
                format,
            }, config));
            return;
        }
        const patterns = include.map((path) => (0, utils_1.replacePlaceholders)(path, { name: "*" }));
        const candidates = glob_1.default.sync(patterns.length > 1 ? `{${patterns.join(",")}}` : patterns[0], {
            ignore: exclude,
            mark: true,
        });
        candidates.forEach((catalogDir) => {
            const name = path_1.default.basename(catalogDir);
            catalogs.push(new catalog_1.Catalog({
                name,
                path: (0, utils_1.normalizeRelativePath)((0, utils_1.replacePlaceholders)(catalog.path, { name })),
                include: include.map((path) => (0, utils_1.replacePlaceholders)(path, { name })),
                exclude: exclude.map((path) => (0, utils_1.replacePlaceholders)(path, { name })),
                format,
            }, config));
        });
    });
    if ((_b = (_a = config.experimental) === null || _a === void 0 ? void 0 : _a.extractor) === null || _b === void 0 ? void 0 : _b.entries.length) {
        catalogs.push(...(await (0, getExperimentalCatalogs_1.getExperimentalCatalogs)(config)));
    }
    return catalogs;
}
exports.getCatalogs = getCatalogs;
/**
 * Ensure that value is always array. If not, turn it into an array of one element.
 */
const ensureArray = (value) => {
    if (value == null)
        return [];
    return Array.isArray(value) ? value : [value];
};
/**
 * Create catalog for merged messages.
 */
async function getCatalogForMerge(config) {
    const format = await (0, formats_1.getFormat)(config.format, config.formatOptions, config.sourceLocale);
    validateCatalogPath(config.catalogsMergePath, format.getCatalogExtension());
    return new catalog_1.Catalog({
        name: getCatalogName(config.catalogsMergePath),
        path: (0, utils_1.normalizeRelativePath)(config.catalogsMergePath),
        include: [],
        exclude: [],
        format,
    }, config);
}
exports.getCatalogForMerge = getCatalogForMerge;
function getCatalogForFile(file, catalogs) {
    for (const catalog of catalogs) {
        const catalogFile = `${catalog.path}${catalog.format.getCatalogExtension()}`;
        const catalogGlob = (0, utils_1.replacePlaceholders)(catalogFile, { locale: "*" });
        const matchPattern = (0, utils_1.normalizeRelativePath)(path_1.default.relative(catalog.config.rootDir, catalogGlob))
            .replace("(", "\\(")
            .replace(")", "\\)");
        const match = micromatch_1.default.capture(matchPattern, (0, utils_1.normalizeRelativePath)(file));
        if (match) {
            return {
                locale: match[0],
                catalog,
            };
        }
    }
    return null;
}
exports.getCatalogForFile = getCatalogForFile;
/**
 *  Validate that `catalogPath` doesn't end with trailing slash
 */
function validateCatalogPath(path, extension) {
    if (!path.endsWith(utils_1.PATHSEP)) {
        return;
    }
    const correctPath = path.slice(0, -1);
    const examplePath = (0, utils_1.replacePlaceholders)(correctPath, {
        locale: "en",
    }) + extension;
    throw new Error(
    // prettier-ignore
    `Remove trailing slash from "${path}". Catalog path isn't a directory,` +
        ` but translation file without extension. For example, catalog path "${correctPath}"` +
        ` results in translation file "${examplePath}".`);
}
function getCatalogName(filePath) {
    // catalog name is the last directory of catalogPath.
    // If the last part is {locale}, then catalog doesn't have an explicit name
    const _name = path_1.default.basename((0, utils_1.normalizeRelativePath)(filePath));
    return _name !== LOCALE_PH ? _name : null;
}
