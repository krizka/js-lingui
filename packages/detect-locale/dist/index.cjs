'use strict';

function getCookie(key) {
  if (!key) {
    return;
  }
  const cookies = globalThis.document.cookie ? globalThis.document.cookie.split("; ") : [];
  const jar = {};
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split("=");
    let value = parts.slice(1).join("=");
    if (value[0] === '"') {
      value = value.slice(1, -1);
    }
    try {
      const foundKey = parts[0].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      jar[foundKey] = value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      if (key === foundKey) {
        break;
      }
    } catch (e) {
    }
  }
  return key ? jar[key] : jar;
}

function detectFromCookie(key) {
  return getCookie(key);
}

function detectFromPath(localePathIndex, location = globalThis.location) {
  const locale = location.pathname.match(/\/([a-zA-Z-]*)/g);
  if (Array.isArray(locale)) {
    return locale[localePathIndex].replace("/", "");
  }
  return null;
}

function detectFromStorage(key, options = { useSessionStorage: false }) {
  if (options.useSessionStorage) {
    return globalThis.sessionStorage.getItem(key);
  }
  return globalThis.localStorage.getItem(key);
}

function detectFromNavigator(navigator = globalThis.navigator) {
  const result = navigator.language || navigator.userLanguage;
  return result;
}

function detectFromSubdomain(localeSubdomainIndex, location = globalThis.location) {
  const locale = location.href.match(
    /(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/gi
  );
  if (Array.isArray(locale)) {
    return locale[localeSubdomainIndex].replace("http://", "").replace("https://", "").replace(".", "");
  }
  return null;
}

function detectHtmlTag(htmlTagIdentifier, document = globalThis.document) {
  if (htmlTagIdentifier) {
    return document.documentElement.getAttribute(htmlTagIdentifier);
  }
  return null;
}

function parse(query) {
  const parser = /([^=?#&]+)=?([^&]*)/g;
  const result = {};
  let part;
  while (part = parser.exec(query)) {
    const key = decode(part[1]);
    const value = decode(part[2]);
    if (key === null || value === null || key in result)
      continue;
    result[key] = value;
  }
  return result;
}
function decode(input) {
  try {
    return decodeURIComponent(input.replace(/\+/g, " "));
  } catch (e) {
    return null;
  }
}

function detectFromUrl(parameter, location = globalThis.location) {
  if (!parameter)
    throw new Error("fromUrl parameter is required");
  const result = parse(location.search)[parameter] || null;
  return result;
}

function detect(...args) {
  for (let i = 0; i < args.length; i++) {
    const res = typeof args[i] === "function" ? args[i]() : args[i];
    if (res)
      return res;
  }
  return null;
}
function multipleDetect(...args) {
  const locales = [];
  for (let i = 0; i < args.length; i++) {
    const res = typeof args[i] === "function" ? args[i]() : args[i];
    if (res)
      locales.push(res);
  }
  return locales;
}

exports.detect = detect;
exports.fromCookie = detectFromCookie;
exports.fromHtmlTag = detectHtmlTag;
exports.fromNavigator = detectFromNavigator;
exports.fromPath = detectFromPath;
exports.fromStorage = detectFromStorage;
exports.fromSubdomain = detectFromSubdomain;
exports.fromUrl = detectFromUrl;
exports.multipleDetect = multipleDetect;
