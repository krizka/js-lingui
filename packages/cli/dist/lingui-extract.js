"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const conf_1 = require("@lingui/conf");
const api_1 = require("./api");
const stats_1 = require("./api/stats");
const help_1 = require("./api/help");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("./api/utils");
async function command(config, options) {
    options.verbose && console.log("Extracting messages from source files…");
    const catalogs = await (0, api_1.getCatalogs)(config);
    const catalogStats = {};
    let commandSuccess = true;
    const spinner = (0, ora_1.default)().start();
    for (let catalog of catalogs) {
        const result = await catalog.make(Object.assign(Object.assign({}, options), { orderBy: config.orderBy }));
        catalogStats[(0, utils_1.normalizeSlashes)(path_1.default.relative(config.rootDir, catalog.path))] = result || {};
        commandSuccess && (commandSuccess = Boolean(result));
    }
    if (commandSuccess) {
        spinner.succeed();
    }
    else {
        spinner.fail();
    }
    Object.entries(catalogStats).forEach(([key, value]) => {
        console.log(`Catalog statistics for ${key}: `);
        console.log((0, stats_1.printStats)(config, value).toString());
        console.log();
    });
    if (!options.watch) {
        console.log(`(use "${chalk_1.default.yellow((0, help_1.helpRun)("extract"))}" to update catalogs with new messages)`);
        console.log(`(use "${chalk_1.default.yellow((0, help_1.helpRun)("compile"))}" to compile catalogs for production)`);
    }
    // If service key is present in configuration, synchronize with cloud translation platform
    if (typeof config.service === "object" &&
        config.service.name &&
        config.service.name.length) {
        const moduleName = config.service.name.charAt(0).toLowerCase() + config.service.name.slice(1);
        try {
            const module = require(`./services/${moduleName}`);
            await module
                .default(config, options)
                .then(console.log)
                .catch(console.error);
        }
        catch (err) {
            console.error(`Can't load service module ${moduleName}`, err);
        }
    }
    return commandSuccess;
}
exports.default = command;
if (require.main === module) {
    commander_1.program
        .option("--config <path>", "Path to the config file")
        .option("--locale <locale>", "Only extract the specified locale")
        .option("--overwrite", "Overwrite translations for source locale")
        .option("--clean", "Remove obsolete translations")
        .option("--debounce <delay>", "Debounces extraction for given amount of milliseconds")
        .option("--verbose", "Verbose output")
        .option("--convert-from <format>", "Convert from previous format of message catalogs")
        .option("--watch", "Enables Watch Mode")
        .parse(process.argv);
    const options = commander_1.program.opts();
    const config = (0, conf_1.getConfig)({
        configPath: options.config,
    });
    let hasErrors = false;
    const prevFormat = options.convertFrom;
    if (prevFormat && config.format === prevFormat) {
        hasErrors = true;
        console.error("Trying to migrate message catalog to the same format");
        console.error(`Set ${chalk_1.default.bold("new")} format in LinguiJS configuration\n` +
            ` and ${chalk_1.default.bold("previous")} format using --convert-from option.`);
        console.log();
        console.log(`Example: Convert from lingui format to minimal`);
        console.log(chalk_1.default.yellow((0, help_1.helpRun)(`extract --convert-from lingui`)));
        process.exit(1);
    }
    if (options.locale && !config.locales.includes(options.locale)) {
        hasErrors = true;
        console.error(`Locale ${chalk_1.default.bold(options.locale)} does not exist.`);
        console.error();
    }
    if (hasErrors)
        process.exit(1);
    const extract = (filePath) => {
        return command(config, {
            verbose: options.watch || options.verbose || false,
            clean: options.watch ? false : options.clean || false,
            overwrite: options.watch || options.overwrite || false,
            locale: options.locale,
            watch: options.watch || false,
            files: (filePath === null || filePath === void 0 ? void 0 : filePath.length) ? filePath : undefined,
            prevFormat,
        });
    };
    const changedPaths = new Set();
    let debounceTimer;
    let previousExtract = Promise.resolve(true);
    const dispatchExtract = (filePath) => {
        // Skip debouncing if not enabled but still chain them so no racing issue
        // on deleting the tmp folder.
        if (!options.debounce) {
            previousExtract = previousExtract.then(() => extract(filePath));
            return previousExtract;
        }
        filePath === null || filePath === void 0 ? void 0 : filePath.forEach((path) => changedPaths.add(path));
        // CLear the previous timer if there is any, and schedule the next
        debounceTimer && clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const filePath = [...changedPaths];
            changedPaths.clear();
            await extract(filePath);
        }, options.debounce);
    };
    // Check if Watch Mode is enabled
    if (options.watch) {
        console.info(chalk_1.default.bold("Initializing Watch Mode..."));
        (async function initWatch() {
            const catalogs = await (0, api_1.getCatalogs)(config);
            let paths = [];
            let ignored = [];
            catalogs.forEach((catalog) => {
                paths.push(...catalog.include);
                ignored.push(...catalog.exclude);
            });
            const watcher = chokidar_1.default.watch(paths, {
                ignored: ["/(^|[/\\])../", ...ignored],
                persistent: true,
            });
            const onReady = () => {
                console.info(chalk_1.default.green.bold("Watcher is ready!"));
                watcher
                    .on("add", (path) => dispatchExtract([path]))
                    .on("change", (path) => dispatchExtract([path]));
            };
            watcher.on("ready", () => onReady());
        })();
    }
    else if (commander_1.program.args) {
        // this behaviour occurs when we extract files by his name
        // for ex: lingui extract src/app, this will extract only files included in src/app
        extract(commander_1.program.args).then((result) => {
            if (!result)
                process.exit(1);
        });
    }
    else {
        extract().then((result) => {
            if (!result)
                process.exit(1);
        });
    }
}
