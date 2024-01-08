"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageJson = exports.buildExternalizeFilter = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
function createPackageRegExp(packageName) {
    return new RegExp("^" + packageName + "(?:\\/.+)?");
}
function packages(packages, includeDeps) {
    return Object.keys(packages || {})
        .filter((packageName) => {
        return !includeDeps.some((incl) => packageName.startsWith(incl));
    })
        .map(createPackageRegExp);
}
function buildExternalizeFilter({ includeDeps, excludeDeps, packageJson, }) {
    const external = [
        ...packages(packageJson.dependencies, includeDeps),
        ...packages(packageJson.devDependencies, includeDeps),
        ...packages(packageJson.peerDependencies, includeDeps),
        ...packages(packageJson.optionalDependencies, includeDeps),
        ...excludeDeps.map(createPackageRegExp),
    ];
    return (id) => external.some((regExp) => {
        return regExp.test(id);
    });
}
exports.buildExternalizeFilter = buildExternalizeFilter;
async function getPackageJson(rootDir) {
    const { default: pkgUp } = await import("pkg-up");
    const packageJsonPath = await pkgUp({
        cwd: rootDir,
    });
    if (!packageJsonPath) {
        throw new Error("We could not able to find your package.json file. " +
            "Check that `rootDir` is pointing to the folder with package.json");
    }
    try {
        return JSON.parse(await node_fs_1.default.promises.readFile(packageJsonPath, "utf-8"));
    }
    catch (e) {
        throw new Error(`Unable to read package.json file at path ${packageJsonPath}. \n\n Error: ${e.message}`);
    }
}
exports.getPackageJson = getPackageJson;
