"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleSource = void 0;
const buildExternalizeFilter_1 = require("./buildExternalizeFilter");
function createExtRegExp(extensions) {
    return new RegExp("\\.(?:" + extensions.join("|") + ")(?:\\?.*)?$");
}
async function bundleSource(config, entryPoints, outDir, rootDir) {
    const esbuild = await import("esbuild");
    const excludeExtensions = config.excludeExtensions || [
        "ico",
        "pot",
        "xliff",
        "woff2",
        "woff",
        "eot",
        "gif",
        "otf",
        "ttf",
        "mp4",
        "svg",
        "png",
        "css",
        "sass",
        "less",
        "jpg",
    ];
    const packageJson = await (0, buildExternalizeFilter_1.getPackageJson)(rootDir);
    const esbuildOptions = {
        entryPoints: entryPoints,
        outExtension: { ".js": ".jsx" },
        jsx: "preserve",
        bundle: true,
        platform: "node",
        target: ["esnext"],
        format: "esm",
        splitting: false,
        treeShaking: true,
        outdir: outDir,
        sourcemap: "inline",
        sourceRoot: outDir,
        sourcesContent: false,
        outbase: rootDir,
        metafile: true,
        plugins: [
            {
                name: "externalize-deps",
                setup(build) {
                    const isExternal = (0, buildExternalizeFilter_1.buildExternalizeFilter)({
                        includeDeps: config.includeDeps || [],
                        excludeDeps: config.excludeDeps || [],
                        packageJson,
                    });
                    // externalize bare imports
                    build.onResolve({ filter: /^[^.].*/ }, async ({ path: id }) => {
                        if (isExternal(id)) {
                            return {
                                external: true,
                            };
                        }
                    });
                },
            },
            {
                name: "externalize-files",
                setup(build) {
                    build.onResolve({ filter: createExtRegExp(excludeExtensions) }, () => ({
                        external: true,
                    }));
                },
            },
        ],
    };
    return await esbuild.build(config.resolveEsbuildOptions
        ? config.resolveEsbuildOptions(esbuildOptions)
        : esbuildOptions);
}
exports.bundleSource = bundleSource;
