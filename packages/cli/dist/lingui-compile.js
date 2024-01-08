"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const conf_1 = require("@lingui/conf");
const compile_1 = require("./api/compile");
const help_1 = require("./api/help");
const api_1 = require("./api");
const getCatalogs_1 = require("./api/catalog/getCatalogs");
const utils_1 = require("./api/utils");
const path_1 = __importDefault(require("path"));
async function command(config, options) {
    const catalogs = await (0, api_1.getCatalogs)(config);
    // Check config.compile.merge if catalogs for current locale are to be merged into a single compiled file
    const doMerge = !!config.catalogsMergePath;
    let mergedCatalogs = {};
    console.log("Compiling message catalogs…");
    for (const locale of config.locales) {
        for (const catalog of catalogs) {
            const missingMessages = [];
            const messages = await catalog.getTranslations(locale, {
                fallbackLocales: config.fallbackLocales,
                sourceLocale: config.sourceLocale,
                onMissing: (missing) => {
                    missingMessages.push(missing);
                },
            });
            if (!options.allowEmpty && missingMessages.length > 0) {
                console.error(chalk_1.default.red(`Error: Failed to compile catalog for locale ${chalk_1.default.bold(locale)}!`));
                if (options.verbose) {
                    console.error(chalk_1.default.red("Missing translations:"));
                    missingMessages.forEach((missing) => {
                        const source = missing.source || missing.source === missing.id
                            ? `: (${missing.source})`
                            : "";
                        console.error(`${missing.id}${source}`);
                    });
                }
                else {
                    console.error(chalk_1.default.red(`Missing ${missingMessages.length} translation(s)`));
                }
                console.error();
                return false;
            }
            if (doMerge) {
                mergedCatalogs = Object.assign(Object.assign({}, mergedCatalogs), messages);
            }
            else {
                const namespace = options.typescript
                    ? "ts"
                    : options.namespace || config.compileNamespace;
                const compiledCatalog = (0, compile_1.createCompiledCatalog)(locale, messages, {
                    strict: false,
                    namespace,
                    pseudoLocale: config.pseudoLocale,
                    compilerBabelOptions: config.compilerBabelOptions,
                });
                let compiledPath = await catalog.writeCompiled(locale, compiledCatalog, namespace);
                if (options.typescript) {
                    const typescriptPath = compiledPath.replace(/\.ts?$/, "") + ".d.ts";
                    fs_1.default.writeFileSync(typescriptPath, `import type { Messages } from '@lingui/core';
          declare const messages: Messages;
          export { messages };
          `);
                }
                compiledPath = (0, utils_1.normalizeSlashes)(path_1.default.relative(config.rootDir, compiledPath));
                options.verbose &&
                    console.error(chalk_1.default.green(`${locale} ⇒ ${compiledPath}`));
            }
        }
        if (doMerge) {
            const compileCatalog = await (0, getCatalogs_1.getCatalogForMerge)(config);
            const namespace = options.namespace || config.compileNamespace;
            const compiledCatalog = (0, compile_1.createCompiledCatalog)(locale, mergedCatalogs, {
                strict: false,
                namespace: namespace,
                pseudoLocale: config.pseudoLocale,
                compilerBabelOptions: config.compilerBabelOptions,
            });
            let compiledPath = await compileCatalog.writeCompiled(locale, compiledCatalog, namespace);
            compiledPath = (0, utils_1.normalizeSlashes)(path_1.default.relative(config.rootDir, compiledPath));
            options.verbose && console.log(chalk_1.default.green(`${locale} ⇒ ${compiledPath}`));
        }
    }
    return true;
}
exports.command = command;
if (require.main === module) {
    commander_1.program
        .description("Add compile message catalogs and add language data (plurals) to compiled bundle.")
        .option("--config <path>", "Path to the config file")
        .option("--strict", "Disable defaults for missing translations")
        .option("--verbose", "Verbose output")
        .option("--typescript", "Create Typescript definition for compiled bundle")
        .option("--namespace <namespace>", "Specify namespace for compiled bundle. Ex: cjs(default) -> module.exports, es -> export, window.test -> window.test")
        .option("--watch", "Enables Watch Mode")
        .option("--debounce <delay>", "Debounces compilation for given amount of milliseconds")
        .on("--help", function () {
        console.log("\n  Examples:\n");
        console.log("    # Compile translations and use defaults or message IDs for missing translations");
        console.log(`    $ ${(0, help_1.helpRun)("compile")}`);
        console.log("");
        console.log("    # Compile translations but fail when there are missing");
        console.log("    # translations (don't replace missing translations with");
        console.log("    # default messages or message IDs)");
        console.log(`    $ ${(0, help_1.helpRun)("compile --strict")}`);
    })
        .parse(process.argv);
    const options = commander_1.program.opts();
    const config = (0, conf_1.getConfig)({ configPath: options.config });
    let previousRun = Promise.resolve(true);
    const compile = () => {
        previousRun = previousRun.then(() => command(config, {
            verbose: options.watch || options.verbose || false,
            allowEmpty: !options.strict,
            typescript: options.typescript || config.compileNamespace === "ts" || false,
            namespace: options.namespace, // we want this to be undefined if user does not specify so default can be used
        }));
        return previousRun;
    };
    let debounceTimer;
    const dispatchCompile = () => {
        // Skip debouncing if not enabled
        if (!options.debounce)
            compile();
        // CLear the previous timer if there is any, and schedule the next
        debounceTimer && clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => compile(), options.debounce);
    };
    // Check if Watch Mode is enabled
    if (options.watch) {
        console.info(chalk_1.default.bold("Initializing Watch Mode..."));
        (async function initWatch() {
            const format = await (0, api_1.getFormat)(config.format, config.formatOptions, config.sourceLocale);
            const catalogs = await (0, api_1.getCatalogs)(config);
            const paths = [];
            config.locales.forEach((locale) => {
                catalogs.forEach((catalog) => {
                    paths.push(`${catalog.path
                        .replace(/{locale}/g, locale)
                        .replace(/{name}/g, "*")}${format.getCatalogExtension()}`);
                });
            });
            const watcher = chokidar_1.default.watch(paths, {
                persistent: true,
            });
            const onReady = () => {
                console.info(chalk_1.default.green.bold("Watcher is ready!"));
                watcher
                    .on("add", () => dispatchCompile())
                    .on("change", () => dispatchCompile());
            };
            watcher.on("ready", () => onReady());
        })();
    }
    else {
        compile().then((results) => {
            if (!results) {
                process.exit(1);
            }
            console.log("Done!");
        });
    }
}
