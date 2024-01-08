"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRelativePath = exports.normalizeSlashes = exports.makeInstall = exports.hasYarn = exports.writeFileIfChanged = exports.writeFile = exports.isDirectory = exports.readFile = exports.replacePlaceholders = exports.prettyOrigin = exports.PATHSEP = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const normalize_path_1 = __importDefault(require("normalize-path"));
exports.PATHSEP = "/"; // force posix everywhere
function prettyOrigin(origins) {
    try {
        return origins.map((origin) => origin.join(":")).join(", ");
    }
    catch (e) {
        return "";
    }
}
exports.prettyOrigin = prettyOrigin;
function replacePlaceholders(input, values) {
    return input.replace(/\{([^}]+)}/g, (m, placeholder) => {
        var _a;
        return (_a = values[placeholder]) !== null && _a !== void 0 ? _a : m;
    });
}
exports.replacePlaceholders = replacePlaceholders;
async function readFile(fileName) {
    try {
        return (await fs_1.default.promises.readFile(fileName, "utf-8")).toString();
    }
    catch (err) {
        if (err.code != "ENOENT") {
            throw err;
        }
    }
}
exports.readFile = readFile;
async function mkdirp(dir) {
    try {
        await fs_1.default.promises.mkdir(dir, {
            recursive: true,
        });
    }
    catch (err) {
        if (err.code != "EEXIST") {
            throw err;
        }
    }
}
function isDirectory(filePath) {
    try {
        return fs_1.default.lstatSync(filePath).isDirectory();
    }
    catch (err) {
        if (err.code != "ENOENT") {
            throw err;
        }
    }
}
exports.isDirectory = isDirectory;
async function writeFile(fileName, content) {
    await mkdirp(path_1.default.dirname(fileName));
    await fs_1.default.promises.writeFile(fileName, content, "utf-8");
}
exports.writeFile = writeFile;
async function writeFileIfChanged(filename, newContent) {
    const raw = await readFile(filename);
    if (raw) {
        if (newContent !== raw) {
            await writeFile(filename, newContent);
        }
    }
    else {
        await writeFile(filename, newContent);
    }
}
exports.writeFileIfChanged = writeFileIfChanged;
function hasYarn() {
    return fs_1.default.existsSync(path_1.default.resolve("yarn.lock"));
}
exports.hasYarn = hasYarn;
function makeInstall(packageName, dev = false) {
    const withYarn = hasYarn();
    return withYarn
        ? `yarn add ${dev ? "--dev " : ""}${packageName}`
        : `npm install ${dev ? "--save-dev" : "--save"} ${packageName}`;
}
exports.makeInstall = makeInstall;
/**
 * Normalize Windows backslashes in path so they look always as posix
 */
function normalizeSlashes(path) {
    return path.replace("\\", "/");
}
exports.normalizeSlashes = normalizeSlashes;
/**
 * Remove ./ at the beginning: ./relative  => relative
 *                             relative    => relative
 * Preserve directories:       ./relative/ => relative/
 * Preserve absolute paths:    /absolute/path => /absolute/path
 */
function normalizeRelativePath(sourcePath) {
    if (path_1.default.isAbsolute(sourcePath)) {
        // absolute path
        return (0, normalize_path_1.default)(sourcePath, false);
    }
    // https://github.com/lingui/js-lingui/issues/809
    const isDir = isDirectory(sourcePath);
    return ((0, normalize_path_1.default)(path_1.default.relative(process.cwd(), sourcePath), false) +
        (isDir ? "/" : ""));
}
exports.normalizeRelativePath = normalizeRelativePath;
