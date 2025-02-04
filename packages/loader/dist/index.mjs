import path from 'path';
import { getConfig } from '@lingui/conf';
import { getCatalogForFile, getCatalogs, getCatalogDependentFiles, createCompiledCatalog } from '@lingui/cli/api';

const loader = async function(source) {
  const options = this.getOptions() || {};
  const config = getConfig({
    configPath: options.config,
    cwd: path.dirname(this.resourcePath)
  });
  const catalogRelativePath = path.relative(config.rootDir, this.resourcePath);
  const fileCatalog = getCatalogForFile(
    catalogRelativePath,
    await getCatalogs(config)
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
  const dependency = await getCatalogDependentFiles(catalog, locale);
  dependency.forEach((file) => this.addDependency(path.normalize(file)));
  const messages = await catalog.getTranslations(locale, {
    fallbackLocales: config.fallbackLocales,
    sourceLocale: config.sourceLocale
  });
  const strict = process.env.NODE_ENV !== "production";
  return createCompiledCatalog(locale, messages, {
    strict,
    namespace: this._module.type === "json" ? "json" : "es",
    pseudoLocale: config.pseudoLocale
  });
};
const loader$1 = loader;

export { loader$1 as default };
