'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const conf = require('@lingui/conf');
const api = require('@lingui/cli/api');
const path = require('path');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const path__default = /*#__PURE__*/_interopDefaultCompat(path);

const fileRegex = /(\.po|\?lingui)$/;
function lingui(linguiConfig = {}) {
  const config = conf.getConfig(linguiConfig);
  return [
    {
      name: "vite-plugin-lingui-report-macro-error",
      enforce: "pre",
      resolveId(id) {
        if (id.includes("@lingui/macro")) {
          throw new Error(
            `The macro you imported from "@lingui/macro" is being executed outside the context of compilation. 
This indicates that you don't have the "babel-plugin-macros" or "@lingui/swc-plugin" configured correctly. Please see the documentation for how to configure Vite with Lingui correctly: https://lingui.dev/tutorials/setup-vite`
          );
        }
      }
    },
    {
      name: "vite-plugin-lingui",
      config: (config2) => {
        if (!config2.optimizeDeps) {
          config2.optimizeDeps = {};
        }
        config2.optimizeDeps.exclude = config2.optimizeDeps.exclude || [];
        config2.optimizeDeps.exclude.push("@lingui/macro");
      },
      async transform(src, id) {
        if (fileRegex.test(id)) {
          id = id.split("?")[0];
          const catalogRelativePath = path__default.relative(config.rootDir, id);
          const fileCatalog = api.getCatalogForFile(
            catalogRelativePath,
            await api.getCatalogs(config)
          );
          if (!fileCatalog) {
            throw new Error(
              `Requested resource ${catalogRelativePath} is not matched to any of your catalogs paths specified in "lingui.config".

Resource: ${id}

Your catalogs:
${config.catalogs.map((c) => c.path).join("\n")}
Please check that catalogs.path is filled properly.
`
            );
          }
          const { locale, catalog } = fileCatalog;
          const dependency = await api.getCatalogDependentFiles(catalog, locale);
          dependency.forEach((file) => this.addWatchFile(file));
          const messages = await catalog.getTranslations(locale, {
            fallbackLocales: config.fallbackLocales,
            sourceLocale: config.sourceLocale
          });
          const compiled = api.createCompiledCatalog(locale, messages, {
            strict: false,
            namespace: "es",
            pseudoLocale: config.pseudoLocale
          });
          return {
            code: compiled,
            map: null
            // provide source map if available
          };
        }
      }
    }
  ];
}

exports.default = lingui;
exports.lingui = lingui;
