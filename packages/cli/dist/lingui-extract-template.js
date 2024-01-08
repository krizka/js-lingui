"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const conf_1 = require("@lingui/conf");
const api_1 = require("./api");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./api/utils");
async function command(config, options) {
    options.verbose && console.log("Extracting messages from source files…");
    const catalogs = await (0, api_1.getCatalogs)(config);
    const catalogStats = {};
    let commandSuccess = true;
    await Promise.all(catalogs.map(async (catalog) => {
        const result = await catalog.makeTemplate(Object.assign(Object.assign({}, options), { orderBy: config.orderBy }));
        if (result) {
            catalogStats[(0, utils_1.normalizeSlashes)(path_1.default.relative(config.rootDir, catalog.templateFile))] = Object.keys(result).length;
        }
        commandSuccess && (commandSuccess = Boolean(result));
    }));
    Object.entries(catalogStats).forEach(([key, value]) => {
        console.log(`Catalog statistics for ${chalk_1.default.bold(key)}: ${chalk_1.default.green(value)} messages`);
        console.log();
    });
    return commandSuccess;
}
exports.default = command;
if (require.main === module) {
    commander_1.program
        .option("--config <path>", "Path to the config file")
        .option("--verbose", "Verbose output")
        .parse(process.argv);
    const options = commander_1.program.opts();
    const config = (0, conf_1.getConfig)({
        configPath: options.config,
    });
    const result = command(config, {
        verbose: options.verbose || false,
    }).then(() => {
        if (!result)
            process.exit(1);
    });
}
