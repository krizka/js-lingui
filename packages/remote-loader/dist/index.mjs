import * as R from 'ramda';
import { compileMessage } from '@lingui/message-utils/compileMessage';

function createBrowserCompiledCatalog(messages) {
  return Object.keys(messages).reduce((obj, key) => {
    const value = messages[key];
    const translation = value || key;
    obj[key] = compileMessage(translation);
    return obj;
  }, {});
}

const deserialize = R.map((translation) => ({
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
  const mapTranslationsToInterporlatedString = R.mapObjIndexed((_, key) => {
    if (parsedMessages[key].translation === "" && parsedFallbackMessages?.[key]?.translation) {
      return parsedFallbackMessages[key].translation;
    }
    return parsedMessages[key].translation;
  }, parsedMessages);
  return createBrowserCompiledCatalog(mapTranslationsToInterporlatedString);
}

export { remoteLoader };
