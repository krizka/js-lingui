'use strict';

const R = require('ramda');
const compileMessage = require('@lingui/message-utils/compileMessage');

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

function createBrowserCompiledCatalog(messages) {
  return Object.keys(messages).reduce((obj, key) => {
    const value = messages[key];
    const translation = value || key;
    obj[key] = compileMessage.compileMessage(translation);
    return obj;
  }, {});
}

const deserialize = R__namespace.map((translation) => ({
  translation,
  obsolete: false,
  message: null,
  origin: []
}));
const PARSERS = {
  minimal: (content) => {
    return deserialize(content);
  }
};
const PARSERS$1 = PARSERS;

function remoteLoader({
  format = "minimal",
  fallbackMessages,
  messages
}) {
  let parsedMessages;
  let parsedFallbackMessages;
  if (format) {
    const formatter = PARSERS$1[format];
    if (fallbackMessages) {
      parsedFallbackMessages = typeof fallbackMessages === "object" ? PARSERS$1.minimal(fallbackMessages) : formatter(fallbackMessages);
    }
    parsedMessages = formatter(messages);
  } else {
    throw new Error(`
        *format* value in the Lingui configuration is required to make this loader 100% functional
        Read more about this here: https://lingui.dev/ref/conf#format
      `);
  }
  const mapTranslationsToInterporlatedString = R__namespace.mapObjIndexed((_, key) => {
    if (parsedMessages[key].translation === "" && parsedFallbackMessages?.[key]?.translation) {
      return parsedFallbackMessages[key].translation;
    }
    return parsedMessages[key].translation;
  }, parsedMessages);
  return createBrowserCompiledCatalog(mapTranslationsToInterporlatedString);
}

exports.remoteLoader = remoteLoader;
