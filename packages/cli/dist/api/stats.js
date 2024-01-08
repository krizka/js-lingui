"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStats = exports.getStats = void 0;
// @ts-ignore
const cli_table_1 = __importDefault(require("cli-table"));
const chalk_1 = __importDefault(require("chalk"));
function getStats(catalog) {
    return [
        Object.keys(catalog).length,
        Object.keys(catalog).filter((key) => !catalog[key].translation).length,
    ];
}
exports.getStats = getStats;
function printStats(config, catalogs) {
    const table = new cli_table_1.default({
        head: ["Language", "Total count", "Missing"],
        colAligns: ["left", "middle", "middle"],
        style: {
            head: ["green"],
            border: [],
            compact: true,
        },
    });
    Object.keys(catalogs).forEach((locale) => {
        const catalog = catalogs[locale];
        // catalog is null if no catalog exists on disk and the locale
        // was not extracted due to a `--locale` filter
        const [all, translated] = catalog ? getStats(catalog) : ["-", "-"];
        if (config.sourceLocale === locale) {
            table.push({ [`${chalk_1.default.bold(locale)} (source)`]: [all, "-"] });
        }
        else {
            table.push({ [locale]: [all, translated] });
        }
    });
    return table;
}
exports.printStats = printStats;
