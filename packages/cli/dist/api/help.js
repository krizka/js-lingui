"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpRun = void 0;
/**
 * Detect where's is the command lingui extract or lingui compile
 * and how is being run (npm, yarn) and construct help
 * for follow-up commands based on that.
 *
 * Example:
 * $ yarn extract
 * ...
 * (use "yarn compile" to compile catalogs for production)
 *
 * $ yarn lingui extract
 * ...
 * (use "yarn lingui compile" to compile catalogs for production)
 *
 * $ npm run extract
 * ...
 * (use "npm run compile" to compile catalogs for production)
 */
const path_1 = require("path");
function helpRun(command) {
    let findRootPkgJson;
    try {
        findRootPkgJson = require((0, path_1.resolve)((0, path_1.join)(process.cwd(), "package.json")));
    }
    catch (error) { }
    if (findRootPkgJson === null || findRootPkgJson === void 0 ? void 0 : findRootPkgJson.scripts) {
        const res = Object.entries(findRootPkgJson.scripts).find(([_, value]) => value.includes(`lingui ${command}`));
        if (res) {
            command = res[0];
        }
    }
    const isYarn = process.env.npm_config_user_agent &&
        process.env.npm_config_user_agent.includes("yarn");
    const runCommand = isYarn ? "yarn" : "npm run";
    return `${runCommand} ${command}`;
}
exports.helpRun = helpRun;
