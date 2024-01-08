'use strict';

const Papa = require('papaparse');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const Papa__default = /*#__PURE__*/_interopDefaultCompat(Papa);

const serialize = (catalog) => {
  const rawArr = Object.keys(catalog).map((key) => [
    key,
    catalog[key].translation
  ]);
  return Papa__default.unparse(rawArr);
};
const deserialize = (raw) => {
  const rawCatalog = Papa__default.parse(raw);
  const messages = {};
  if (rawCatalog.errors.length) {
    throw new Error(
      rawCatalog.errors.map((err) => JSON.stringify(err)).join(";")
    );
  }
  rawCatalog.data.forEach(([key, translation]) => {
    messages[key] = {
      translation,
      obsolete: false,
      message: null,
      origin: []
    };
  });
  return messages;
};
function formatter() {
  return {
    catalogExtension: ".csv",
    parse(content) {
      return deserialize(content);
    },
    serialize(catalog) {
      return serialize(catalog);
    }
  };
}

exports.formatter = formatter;
