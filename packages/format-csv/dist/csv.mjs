import Papa from 'papaparse';

const serialize = (catalog) => {
  const rawArr = Object.keys(catalog).map((key) => [
    key,
    catalog[key].translation
  ]);
  return Papa.unparse(rawArr);
};
const deserialize = (raw) => {
  const rawCatalog = Papa.parse(raw);
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

export { formatter };
