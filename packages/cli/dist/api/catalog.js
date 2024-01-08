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
exports.orderByMessage = exports.order = exports.cleanObsolete = exports.Catalog = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const R = __importStar(require("ramda"));
const glob_1 = __importDefault(require("glob"));
const normalize_path_1 = __importDefault(require("normalize-path"));
const getTranslationsForCatalog_1 = require("./catalog/getTranslationsForCatalog");
const mergeCatalog_1 = require("./catalog/mergeCatalog");
const extractFromFiles_1 = require("./catalog/extractFromFiles");
const utils_1 = require("./utils");
const LOCALE = "{locale}";
const LOCALE_SUFFIX_RE = /\{locale\}.*$/;
class Catalog {
    constructor({ name, path, include, templatePath, format, exclude = [] }, config) {
        this.config = config;
        this.name = name;
        this.path = (0, utils_1.normalizeRelativePath)(path);
        this.include = include.map(utils_1.normalizeRelativePath);
        this.exclude = [this.localeDir, ...exclude.map(utils_1.normalizeRelativePath)];
        this.format = format;
        this.templateFile =
            templatePath ||
                getTemplatePath(this.format.getTemplateExtension(), this.path);
    }
    getFilename(locale) {
        return ((0, utils_1.replacePlaceholders)(this.path, { locale }) +
            this.format.getCatalogExtension());
    }
    async make(options) {
        const nextCatalog = await this.collect({ files: options.files });
        if (!nextCatalog)
            return false;
        const prevCatalogs = await this.readAll();
        const catalogs = this.merge(prevCatalogs, nextCatalog, {
            overwrite: options.overwrite,
            files: options.files,
        });
        // Map over all locales and post-process each catalog
        const cleanAndSort = R.map(R.pipe(
        // Clean obsolete messages
        (options.clean ? exports.cleanObsolete : R.identity), 
        // Sort messages
        order(options.orderBy)));
        const sortedCatalogs = cleanAndSort(catalogs);
        const locales = options.locale ? [options.locale] : this.locales;
        await Promise.all(locales.map((locale) => this.write(locale, sortedCatalogs[locale])));
        return sortedCatalogs;
    }
    async makeTemplate(options) {
        const catalog = await this.collect({ files: options.files });
        if (!catalog)
            return false;
        const sorted = order(options.orderBy)(catalog);
        await this.writeTemplate(sorted);
        return sorted;
    }
    /**
     * Collect messages from source paths. Return a raw message catalog as JSON.
     */
    async collect(options = {}) {
        let paths = this.sourcePaths;
        if (options.files) {
            options.files = options.files.map((p) => (0, normalize_path_1.default)(p, false));
            const regex = new RegExp(options.files.join("|"), "i");
            paths = paths.filter((path) => regex.test(path));
        }
        return await (0, extractFromFiles_1.extractFromFiles)(paths, this.config);
    }
    /*
     *
     * prevCatalogs - map of message catalogs in all available languages with translations
     * nextCatalog - language-agnostic catalog with collected messages
     *
     * Note: if a catalog in prevCatalogs is null it means the language is available, but
     * no previous catalog was generated (usually first run).
     *
     * Orthogonal use-cases
     * --------------------
     *
     * Message IDs:
     * - auto-generated IDs: message is used as a key, `defaults` is not set
     * - custom IDs: message is used as `defaults`, custom ID as a key
     *
     * Source locale (defined by `sourceLocale` in config):
     * - catalog for `sourceLocale`: initially, `translation` is prefilled with `defaults`
     *   (for custom IDs) or `key` (for auto-generated IDs)
     * - all other languages: translation is kept empty
     */
    merge(prevCatalogs, nextCatalog, options) {
        return R.mapObjIndexed((prevCatalog, locale) => {
            return (0, mergeCatalog_1.mergeCatalog)(prevCatalog, nextCatalog, this.config.sourceLocale === locale, options);
        }, prevCatalogs);
    }
    async getTranslations(locale, options) {
        return await (0, getTranslationsForCatalog_1.getTranslationsForCatalog)(this, locale, options);
    }
    async write(locale, messages) {
        const filename = this.getFilename(locale);
        const created = !fs_1.default.existsSync(filename);
        await this.format.write(filename, messages, locale);
        return [created, filename];
    }
    async writeTemplate(messages) {
        const filename = this.templateFile;
        await this.format.write(filename, messages, undefined);
    }
    async writeCompiled(locale, compiledCatalog, namespace) {
        let ext;
        if (namespace === "es") {
            ext = "mjs";
        }
        else if (namespace === "ts") {
            ext = "ts";
        }
        else {
            ext = "js";
        }
        const filename = `${(0, utils_1.replacePlaceholders)(this.path, { locale })}.${ext}`;
        await (0, utils_1.writeFile)(filename, compiledCatalog);
        return filename;
    }
    async read(locale) {
        return await this.format.read(this.getFilename(locale), locale);
    }
    async readAll() {
        const res = {};
        await Promise.all(this.locales.map(async (locale) => (res[locale] = await this.read(locale))));
        // statement above will save locales in object in undetermined order
        // resort here to have keys order the same as in locales definition
        return this.locales.reduce((acc, locale) => {
            acc[locale] = res[locale];
            return acc;
        }, {});
    }
    async readTemplate() {
        const filename = this.templateFile;
        return await this.format.read(filename, undefined);
    }
    get sourcePaths() {
        const includeGlobs = this.include.map((includePath) => {
            const isDir = (0, utils_1.isDirectory)(includePath);
            /**
             * glob library results from absolute patterns such as /foo/* are mounted onto the root setting using path.join.
             * On windows, this will by default result in /foo/* matching C:\foo\bar.txt.
             */
            return isDir
                ? (0, normalize_path_1.default)(path_1.default.resolve(process.cwd(), includePath === "/" ? "" : includePath, "**/*.*"))
                : includePath;
        });
        const patterns = includeGlobs.length > 1 ? `{${includeGlobs.join(",")}}` : includeGlobs[0];
        return glob_1.default.sync(patterns, { ignore: this.exclude, mark: true });
    }
    get localeDir() {
        const localePatternIndex = this.path.indexOf(LOCALE);
        if (localePatternIndex === -1) {
            throw Error(`Invalid catalog path: ${LOCALE} variable is missing`);
        }
        return this.path.substr(0, localePatternIndex);
    }
    get locales() {
        return this.config.locales;
    }
}
exports.Catalog = Catalog;
function getTemplatePath(ext, path) {
    return path.replace(LOCALE_SUFFIX_RE, "messages" + ext);
}
exports.cleanObsolete = R.filter((message) => !message.obsolete);
function order(by) {
    return {
        messageId: orderByMessageId,
        message: orderByMessage,
        origin: orderByOrigin,
    }[by];
}
exports.order = order;
function orderKeys(messages, comparer) {
    return Object.keys(messages)
        .sort(comparer)
        .reduce((acc, key) => {
        acc[key] = messages[key];
        return acc;
    }, {});
}
/**
 * Object keys are in the same order as they were created
 * https://stackoverflow.com/a/31102605/1535540
 */
function orderByMessageId(messages) {
    return orderKeys(messages, (a, b) => {
        return a.localeCompare(b);
    });
}
function orderByOrigin(messages) {
    function getFirstOrigin(messageKey) {
        const sortedOrigins = messages[messageKey].origin.sort((a, b) => a[0].localeCompare(b[0]));
        return sortedOrigins[0];
    }
    return orderKeys(messages, (a, b) => {
        const [aFile, aLineNumber] = getFirstOrigin(a);
        const [bFile, bLineNumber] = getFirstOrigin(b);
        return aFile.localeCompare(bFile) || aLineNumber - bLineNumber;
    });
}
function orderByMessage(messages) {
    // hardcoded en-US locale to have consistent sorting
    // @see https://github.com/lingui/js-lingui/pull/1808
    const collator = new Intl.Collator("en-US");
    return orderKeys(messages, (a, b) => {
        const aMsg = messages[a].message || "";
        const bMsg = messages[b].message || "";
        return collator.compare(aMsg, bMsg);
    });
}
exports.orderByMessage = orderByMessage;
