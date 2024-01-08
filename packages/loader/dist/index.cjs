'use strict';

const path = require('path');
const conf = require('@lingui/conf');
const api = require('@lingui/cli/api');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const path__default = /*#__PURE__*/_interopDefaultCompat(path);

const loader = async function(source) {
  const options = this.getOptions() || {};
  const config = conf.getConfig({
    configPath: options.config,
    cwd: path__default.dirname(this.resourcePath)
  });
  const catalogRelativePath = path__default.relative(config.rootDir, this.resourcePath);
  const fileCatalog = api.getCatalogForFile(
    catalogRelativePath,
    await api.getCatalogs(config)
  );
  if (!fileCatalog) {
    throw new Error(
      `Requested resource ${catalogRelativePath} is not matched to any of your catalogs paths specified in "lingui.config".

Resource: ${this.resourcePath}

Your catalogs:
${config.catalogs.map((c) => c.path).join("\n")}

Working dir is: 
${process.cwd()}

Please check that \`catalogs.path\` is filled properly.
`
    );
  }
  const { locale, catalog } = fileCatalog;
  const dependency = await api.getCatalogDependentFiles(catalog, locale);
  dependency.forEach((file) => this.addDependency(path__default.normalize(file)));
  const messages = await catalog.getTranslations(locale, {
    fallbackLocales: config.fallbackLocales,
    sourceLocale: config.sourceLocale
  });
  const strict = process.env.NODE_ENV !== "production";
  return api.createCompiledCatalog(locale, messages, {
    strict,
    namespace: this._module.type === "json" ? "json" : "es",
    pseudoLocale: config.pseudoLocale
  });
};
const loader$1 = loader;

module.exports = loader$1;
