import * as R from 'ramda';

const serializeMinimal = R.map(
  (message) => message.translation || ""
);
const deserializeMinimal = R.map((translation) => ({
  translation,
  obsolete: false,
  message: null,
  origin: []
}));
const removeOrigins = R.map(({ origin, ...message }) => message);
const removeLineNumbers = R.map((message) => {
  if (message.origin) {
    message.origin = message.origin.map(([file]) => [file]);
  }
  return message;
});
function formatter(options = {}) {
  options = {
    origins: true,
    lineNumbers: true,
    ...options
  };
  return {
    catalogExtension: ".json",
    serialize(catalog, { existing }) {
      let outputCatalog = catalog;
      if (options.origins === false) {
        outputCatalog = removeOrigins(outputCatalog);
      }
      if (options.origins !== false && options.lineNumbers === false) {
        outputCatalog = removeLineNumbers(outputCatalog);
      }
      const shouldUseTrailingNewline = existing === null || existing?.endsWith("\n");
      const trailingNewLine = shouldUseTrailingNewline ? "\n" : "";
      if (options.style === "minimal") {
        outputCatalog = serializeMinimal(outputCatalog);
      }
      return JSON.stringify(outputCatalog, null, options.indentation ?? 2) + trailingNewLine;
    },
    parse(content) {
      const catalog = JSON.parse(content);
      if (options.style === "minimal") {
        return deserializeMinimal(catalog);
      }
      return catalog;
    }
  };
}

export { formatter };
