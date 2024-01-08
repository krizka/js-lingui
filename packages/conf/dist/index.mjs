import chalk from 'chalk';
import { validate, multipleValidOptions } from 'jest-validate';
import path from 'path';
import fs from 'fs';
import { cosmiconfigSync } from 'cosmiconfig';

function replaceRootDir(config, rootDir) {
  return function replaceDeep(value, rootDir2) {
    const replace = (s) => s.replace("<rootDir>", rootDir2);
    if (value == null) {
      return value;
    } else if (typeof value === "string") {
      return replace(value);
    } else if (Array.isArray(value)) {
      return value.map((item) => replaceDeep(item, rootDir2));
    } else if (typeof value === "object") {
      Object.keys(value).forEach((key) => {
        const newKey = replaceDeep(key, rootDir2);
        value[newKey] = replaceDeep(value[key], rootDir2);
        if (key !== newKey)
          delete value[key];
      });
    }
    return value;
  }(config, rootDir);
}

function setCldrParentLocales(config) {
  if (config.fallbackLocales === false) {
    return {
      ...config,
      fallbackLocales: {}
    };
  }
  if (!config.fallbackLocales.default) {
    config.locales.forEach((locale) => {
      const fl = getCldrParentLocale(locale.toLowerCase());
      if (fl && !config.fallbackLocales[locale]) {
        config.fallbackLocales = {
          ...config.fallbackLocales,
          [locale]: fl
        };
      }
    });
  }
  return config;
}
function getCldrParentLocale(sourceLocale) {
  return {
    "en-ag": "en",
    "en-ai": "en",
    "en-au": "en",
    "en-bb": "en",
    "en-bm": "en",
    "en-bs": "en",
    "en-bw": "en",
    "en-bz": "en",
    "en-ca": "en",
    "en-cc": "en",
    "en-ck": "en",
    "en-cm": "en",
    "en-cx": "en",
    "en-cy": "en",
    "en-dg": "en",
    "en-dm": "en",
    "en-er": "en",
    "en-fj": "en",
    "en-fk": "en",
    "en-fm": "en",
    "en-gb": "en",
    "en-gd": "en",
    "en-gg": "en",
    "en-gh": "en",
    "en-gi": "en",
    "en-gm": "en",
    "en-gy": "en",
    "en-hk": "en",
    "en-ie": "en",
    "en-il": "en",
    "en-im": "en",
    "en-in": "en",
    "en-io": "en",
    "en-je": "en",
    "en-jm": "en",
    "en-ke": "en",
    "en-ki": "en",
    "en-kn": "en",
    "en-ky": "en",
    "en-lc": "en",
    "en-lr": "en",
    "en-ls": "en",
    "en-mg": "en",
    "en-mo": "en",
    "en-ms": "en",
    "en-mt": "en",
    "en-mu": "en",
    "en-mw": "en",
    "en-my": "en",
    "en-na": "en",
    "en-nf": "en",
    "en-ng": "en",
    "en-nr": "en",
    "en-nu": "en",
    "en-nz": "en",
    "en-pg": "en",
    "en-ph": "en",
    "en-pk": "en",
    "en-pn": "en",
    "en-pw": "en",
    "en-rw": "en",
    "en-sb": "en",
    "en-sc": "en",
    "en-sd": "en",
    "en-sg": "en",
    "en-sh": "en",
    "en-sl": "en",
    "en-ss": "en",
    "en-sx": "en",
    "en-sz": "en",
    "en-tc": "en",
    "en-tk": "en",
    "en-to": "en",
    "en-tt": "en",
    "en-tv": "en",
    "en-tz": "en",
    "en-ug": "en",
    "en-us": "en",
    "en-vc": "en",
    "en-vg": "en",
    "en-vu": "en",
    "en-ws": "en",
    "en-za": "en",
    "en-zm": "en",
    "en-zw": "en",
    "en-at": "en",
    "en-be": "en",
    "en-ch": "en",
    "en-de": "en",
    "en-dk": "en",
    "en-fi": "en",
    "en-nl": "en",
    "en-se": "en",
    "en-si": "en",
    "es-ar": "es",
    "es-bo": "es",
    "es-br": "es",
    "es-bz": "es",
    "es-cl": "es",
    "es-co": "es",
    "es-cr": "es",
    "es-cu": "es",
    "es-do": "es",
    "es-ec": "es",
    "es-es": "es",
    "es-gt": "es",
    "es-hn": "es",
    "es-mx": "es",
    "es-ni": "es",
    "es-pa": "es",
    "es-pe": "es",
    "es-pr": "es",
    "es-py": "es",
    "es-sv": "es",
    "es-us": "es",
    "es-uy": "es",
    "es-ve": "es",
    "pt-ao": "pt",
    "pt-ch": "pt",
    "pt-cv": "pt",
    "pt-fr": "pt",
    "pt-gq": "pt",
    "pt-gw": "pt",
    "pt-lu": "pt",
    "pt-mo": "pt",
    "pt-mz": "pt",
    "pt-pt": "pt",
    "pt-st": "pt",
    "pt-tl": "pt",
    "az-arab": "az",
    "az-cyrl": "az",
    "blt-latn": "blt",
    "bm-nkoo": "bm",
    "bs-cyrl": "bs",
    "byn-latn": "byn",
    "cu-glag": "cu",
    "dje-arab": "dje",
    "dyo-arab": "dyo",
    "en-dsrt": "en",
    "en-shaw": "en",
    "ff-adlm": "ff",
    "ff-arab": "ff",
    "ha-arab": "ha",
    "hi-latn": "hi",
    "iu-latn": "iu",
    "kk-arab": "kk",
    "ks-deva": "ks",
    "ku-arab": "ku",
    "ky-arab": "ky",
    "ky-latn": "ky",
    "ml-arab": "ml",
    "mn-mong": "mn",
    "mni-mtei": "mni",
    "ms-arab": "ms",
    "pa-arab": "pa",
    "sat-deva": "sat",
    "sd-deva": "sd",
    "sd-khoj": "sd",
    "sd-sind": "sd",
    "shi-latn": "shi",
    "so-arab": "so",
    "sr-latn": "sr",
    "sw-arab": "sw",
    "tg-arab": "tg",
    "ug-cyrl": "ug",
    "uz-arab": "uz",
    "uz-cyrl": "uz",
    "vai-latn": "vai",
    "wo-arab": "wo",
    "yo-arab": "yo",
    "yue-hans": "yue",
    "zh-hant": "zh",
    "zh-hant-hk": "zh",
    "zh-hant-mo": "zh-hant-hk"
  }[sourceLocale];
}

const pathJoinPosix = (...values) => path.join(...values).split(path.sep).join("/");

const getSymbolSource = (defaults, config) => {
  const name = defaults[1];
  if (Array.isArray(config)) {
    if (name === "i18n") {
      return config;
    }
    return defaults;
  }
  return config[name] || defaults;
};
function normalizeRuntimeConfigModule(config) {
  const [i18nImportModule, i18nImportName] = getSymbolSource(
    ["@lingui/core", "i18n"],
    config.runtimeConfigModule
  );
  const [TransImportModule, TransImportName] = getSymbolSource(
    ["@lingui/react", "Trans"],
    config.runtimeConfigModule
  );
  return {
    ...config,
    runtimeConfigModule: {
      i18nImportModule,
      i18nImportName,
      TransImportModule,
      TransImportName
    }
  };
}

function makeConfig(userConfig, opts = {}) {
  let config = {
    ...defaultConfig,
    ...userConfig
  };
  if (!opts.skipValidation) {
    validate(config, configValidation);
    validateLocales(config);
  }
  config = pipe(
    // List config migrations from oldest to newest
    setCldrParentLocales,
    normalizeRuntimeConfigModule
  )(config);
  return replaceRootDir(
    config,
    config.rootDir
  );
}
const defaultConfig = {
  catalogs: [
    {
      path: pathJoinPosix("<rootDir>", "locale", "{locale}", "messages"),
      include: ["<rootDir>"],
      exclude: ["*/node_modules/*"]
    }
  ],
  catalogsMergePath: "",
  compileNamespace: "cjs",
  compilerBabelOptions: {
    minified: true,
    jsescOption: {
      minimal: true
    }
  },
  extractorParserOptions: {
    flow: false,
    tsExperimentalDecorators: false
  },
  fallbackLocales: {},
  format: "po",
  formatOptions: { origins: true, lineNumbers: true },
  locales: [],
  orderBy: "message",
  pseudoLocale: "",
  rootDir: ".",
  runtimeConfigModule: ["@lingui/core", "i18n"],
  sourceLocale: "",
  service: { name: "", apiKey: "" }
};
const exampleConfig = {
  ...defaultConfig,
  format: multipleValidOptions({}, "po"),
  extractors: multipleValidOptions([], ["babel"], [Object]),
  runtimeConfigModule: multipleValidOptions(
    { i18n: ["@lingui/core", "i18n"], Trans: ["@lingui/react", "Trans"] },
    ["@lingui/core", "i18n"]
  ),
  fallbackLocales: multipleValidOptions(
    {},
    { "en-US": "en" },
    { "en-US": ["en"] },
    { default: "en" },
    false
  ),
  extractorParserOptions: {
    flow: false,
    tsExperimentalDecorators: false
  },
  experimental: {
    extractor: {
      entries: [],
      includeDeps: [],
      excludeDeps: [],
      excludeExtensions: [],
      output: "",
      resolveEsbuildOptions: Function
    }
  }
};
const extractBabelOptionsDeprecations = {
  extractBabelOptions: () => ` Option ${chalk.bold("extractBabelOptions")} was removed. 
    
    Please remove it from your config file. 

    You can find more information here: https://lingui.dev/releases/migration-4
    `
};
const configValidation = {
  exampleConfig,
  deprecatedConfig: {
    ...extractBabelOptionsDeprecations
  },
  comment: "Documentation: https://lingui.dev/ref/conf"
};
function validateLocales(config) {
  if (!Array.isArray(config.locales) || !config.locales.length) {
    console.error("No locales defined!\n");
    console.error(
      `Add ${chalk.yellow(
        "'locales'"
      )} to your configuration. See ${chalk.underline(
        "https://lingui.dev/ref/conf#locales"
      )}`
    );
  }
}
const pipe = (...functions) => (args) => functions.reduce((arg, fn) => fn(arg), args);

function configExists(path2) {
  return path2 && fs.existsSync(path2);
}
function JitiLoader() {
  return (filepath, content) => {
    const opts = {
      interopDefault: true
    };
    const jiti = require("jiti")(__filename, opts);
    return jiti(filepath);
  };
}
const moduleName = "lingui";
const configExplorer = cosmiconfigSync(moduleName, {
  searchPlaces: [
    `${moduleName}.config.js`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.mjs`,
    "package.json",
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.js`
  ],
  loaders: {
    ".js": JitiLoader(),
    ".ts": JitiLoader(),
    ".mjs": JitiLoader()
  }
});
function getConfig({
  cwd,
  configPath,
  skipValidation = false
} = {}) {
  const defaultRootDir = cwd || process.cwd();
  configPath = configPath || process.env.LINGUI_CONFIG;
  const result = configExists(configPath) ? configExplorer.load(configPath) : configExplorer.search(defaultRootDir);
  if (!result) {
    console.error("Lingui was unable to find a config!\n");
    console.error(
      `Create ${chalk.bold(
        "'lingui.config.js'"
      )} file with LinguiJS configuration in root of your project (next to package.json). See ${chalk.underline(
        "https://lingui.dev/ref/conf"
      )}`
    );
    throw new Error("No Config");
  }
  const userConfig = result ? result.config : {};
  return makeConfig(
    {
      rootDir: result ? path.dirname(result.filepath) : defaultRootDir,
      ...userConfig
    },
    { skipValidation }
  );
}

export { getConfig, makeConfig };
