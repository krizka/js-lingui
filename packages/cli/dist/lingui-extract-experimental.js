"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const conf_1 = require("@lingui/conf");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const formats_1 = require("./api/formats");
const promises_1 = __importDefault(require("fs/promises"));
const extractFromFiles_1 = require("./api/catalog/extractFromFiles");
const utils_1 = require("./api/utils");
const bundleSource_1 = require("./extract-experimental/bundleSource");
const writeCatalogs_1 = require("./extract-experimental/writeCatalogs");
const getEntryPoints_1 = require("./extract-experimental/getEntryPoints");
const chalk_1 = __importDefault(require("chalk"));
async function command(linguiConfig, options) {
    var _a;
    options.verbose && console.log("Extracting messages from source files…");
    const config = (_a = linguiConfig.experimental) === null || _a === void 0 ? void 0 : _a.extractor;
    if (!config) {
        throw new Error("The configuration for experimental extractor is empty. Please read the docs.");
    }
    console.log(chalk_1.default.yellow([
        "You have using an experimental feature",
        "Experimental features are not covered by semver, and may cause unexpected or broken application behavior." +
            " Use at your own risk.",
        "",
    ].join("\n")));
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), "js-lingui-extract-"));
    await promises_1.default.rm(tempDir, { recursive: true, force: true });
    const bundleResult = await (0, bundleSource_1.bundleSource)(config, (0, getEntryPoints_1.getEntryPoints)(config.entries), tempDir, linguiConfig.rootDir);
    const stats = [];
    let commandSuccess = true;
    const format = await (0, formats_1.getFormat)(linguiConfig.format, linguiConfig.formatOptions, linguiConfig.sourceLocale);
    for (const outFile of Object.keys(bundleResult.metafile.outputs)) {
        const messages = await (0, extractFromFiles_1.extractFromFiles)([outFile], linguiConfig);
        const { entryPoint } = bundleResult.metafile.outputs[outFile];
        let output;
        if (!messages) {
            commandSuccess = false;
            continue;
        }
        if (options.template) {
            output = (await (0, writeCatalogs_1.writeTemplate)({
                linguiConfig,
                clean: options.clean,
                format,
                messages,
                entryPoint,
                outputPattern: config.output,
            })).statMessage;
        }
        else {
            output = (await (0, writeCatalogs_1.writeCatalogs)({
                locales: options.locales || linguiConfig.locales,
                linguiConfig,
                clean: options.clean,
                format,
                messages,
                entryPoint,
                overwrite: options.overwrite,
                outputPattern: config.output,
            })).statMessage;
        }
        stats.push({
            entry: (0, utils_1.normalizeSlashes)(path_1.default.relative(linguiConfig.rootDir, entryPoint)),
            content: output,
        });
    }
    // cleanup temp directory
    await promises_1.default.rm(tempDir, { recursive: true, force: true });
    stats.forEach(({ entry, content }) => {
        console.log([`Catalog statistics for ${entry}:`, content, ""].join("\n"));
    });
    return commandSuccess;
}
exports.default = command;
if (require.main === module) {
    commander_1.program
        .option("--config <path>", "Path to the config file")
        .option("--template", "Extract to template")
        .option("--overwrite", "Overwrite translations for source locale")
        .option("--clean", "Remove obsolete translations")
        .option("--locale <locale, [...]>", "Only extract the specified locales")
        .option("--verbose", "Verbose output")
        .parse(process.argv);
    const options = commander_1.program.opts();
    const config = (0, conf_1.getConfig)({
        configPath: options.config,
    });
    const result = command(config, {
        verbose: options.verbose || false,
        template: options.template,
        locales: (_a = options.locale) === null || _a === void 0 ? void 0 : _a.split(","),
        overwrite: options.overwrite,
        clean: options.clean,
    }).then(() => {
        if (!result)
            process.exit(1);
    });
}
