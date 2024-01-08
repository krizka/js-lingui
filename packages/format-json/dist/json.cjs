'use strict';

const R = require('ramda');

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const R__namespace = /*#__PURE__*/_interopNamespaceCompat(R);

const serializeMinimal = R__namespace.map(
  (message) => message.translation || ""
);
const deserializeMinimal = R__namespace.map((translation) => ({
  translation,
  obsolete: false,
  message: null,
  origin: []
}));
const removeOrigins = R__namespace.map(({ origin, ...message }) => message);
const removeLineNumbers = R__namespace.map((message) => {
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

exports.formatter = formatter;
