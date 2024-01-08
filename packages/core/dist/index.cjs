'use strict';

const unraw = require('unraw');
const compileMessage = require('@lingui/message-utils/compileMessage');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const unraw__default = /*#__PURE__*/_interopDefaultCompat(unraw);

const isString = (s) => typeof s === "string";
const isFunction = (f) => typeof f === "function";

const cache = /* @__PURE__ */ new Map();
const defaultLocale = "en";
function normalizeLocales(locales) {
  const out = Array.isArray(locales) ? locales : [locales];
  return [...out, defaultLocale];
}
function date(locales, value, format) {
  const _locales = normalizeLocales(locales);
  const formatter = getMemoized(
    () => cacheKey("date", _locales, format),
    () => new Intl.DateTimeFormat(_locales, format)
  );
  return formatter.format(isString(value) ? new Date(value) : value);
}
function number(locales, value, format) {
  const _locales = normalizeLocales(locales);
  const formatter = getMemoized(
    () => cacheKey("number", _locales, format),
    () => new Intl.NumberFormat(_locales, format)
  );
  return formatter.format(value);
}
function plural(locales, ordinal, value, { offset = 0, ...rules }) {
  const _locales = normalizeLocales(locales);
  const plurals = ordinal ? getMemoized(
    () => cacheKey("plural-ordinal", _locales),
    () => new Intl.PluralRules(_locales, { type: "ordinal" })
  ) : getMemoized(
    () => cacheKey("plural-cardinal", _locales),
    () => new Intl.PluralRules(_locales, { type: "cardinal" })
  );
  return rules[value] ?? rules[plurals.select(value - offset)] ?? rules.other;
}
function getMemoized(getKey, construct) {
  const key = getKey();
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = construct();
    cache.set(key, formatter);
  }
  return formatter;
}
function cacheKey(type, locales, options) {
  const localeKey = locales.join("-");
  return `${type}-${localeKey}-${JSON.stringify(options)}`;
}

const formats = {
  __proto__: null,
  date: date,
  defaultLocale: defaultLocale,
  number: number,
  plural: plural
};

const UNICODE_REGEX = /\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}/g;
const getDefaultFormats = (locale, passedLocales, formats = {}) => {
  const locales = passedLocales || locale;
  const style = (format) => {
    return typeof format === "object" ? format : formats[format] || { style: format };
  };
  const replaceOctothorpe = (value, message) => {
    const numberFormat = Object.keys(formats).length ? style("number") : void 0;
    const valueStr = number(locales, value, numberFormat);
    return message.replace("#", valueStr);
  };
  return {
    plural: (value, cases) => {
      const { offset = 0 } = cases;
      const message = plural(locales, false, value, cases);
      return replaceOctothorpe(value - offset, message);
    },
    selectordinal: (value, cases) => {
      const { offset = 0 } = cases;
      const message = plural(locales, true, value, cases);
      return replaceOctothorpe(value - offset, message);
    },
    select: selectFormatter,
    number: (value, format) => number(locales, value, style(format)),
    date: (value, format) => date(locales, value, style(format)),
    undefined: undefinedFormatter
  };
};
const selectFormatter = (value, rules) => rules[value] ?? rules.other;
const undefinedFormatter = (value) => value;
function interpolate(translation, locale, locales) {
  return (values = {}, formats) => {
    const formatters = getDefaultFormats(locale, locales, formats);
    const formatMessage = (message) => {
      if (!Array.isArray(message))
        return message;
      return message.reduce((message2, token) => {
        if (isString(token))
          return message2 + token;
        const [name, type, format] = token;
        let interpolatedFormat = {};
        if (format != null && typeof format === "object") {
          Object.entries(format).forEach(([key, value2]) => {
            interpolatedFormat[key] = formatMessage(value2);
          });
        } else {
          interpolatedFormat = format;
        }
        const formatter = formatters[type];
        const value = formatter(values[name], interpolatedFormat);
        if (value == null)
          return message2;
        return message2 + value;
      }, "");
    };
    const result = formatMessage(translation);
    if (isString(result) && UNICODE_REGEX.test(result)) {
      return unraw__default(result.trim());
    }
    if (isString(result))
      return result.trim();
    return result ? String(result) : "";
  };
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class EventEmitter {
  constructor() {
    __publicField$1(this, "_events", {});
  }
  on(event, listener) {
    var _a;
    (_a = this._events)[event] ?? (_a[event] = []);
    this._events[event].push(listener);
    return () => this.removeListener(event, listener);
  }
  removeListener(event, listener) {
    const maybeListeners = this._getListeners(event);
    if (!maybeListeners)
      return;
    const index = maybeListeners.indexOf(listener);
    if (~index)
      maybeListeners.splice(index, 1);
  }
  emit(event, ...args) {
    const maybeListeners = this._getListeners(event);
    if (!maybeListeners)
      return;
    maybeListeners.map((listener) => listener.apply(this, args));
  }
  _getListeners(event) {
    const maybeListeners = this._events[event];
    return Array.isArray(maybeListeners) ? maybeListeners : false;
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class I18n extends EventEmitter {
  constructor(params) {
    super();
    __publicField(this, "_locale", "");
    __publicField(this, "_locales");
    __publicField(this, "_localeData", {});
    __publicField(this, "_messages", {});
    __publicField(this, "_missing");
    /**
     * Alias for {@see I18n._}
     */
    __publicField(this, "t", this._.bind(this));
    if (params.missing != null)
      this._missing = params.missing;
    if (params.messages != null)
      this.load(params.messages);
    if (params.localeData != null)
      this.loadLocaleData(params.localeData);
    if (typeof params.locale === "string" || params.locales) {
      this.activate(params.locale ?? defaultLocale, params.locales);
    }
  }
  get locale() {
    return this._locale;
  }
  get locales() {
    return this._locales;
  }
  get messages() {
    return this._messages[this._locale] ?? {};
  }
  /**
   * @deprecated this has no effect. Please remove this from the code. Deprecated in v4
   */
  get localeData() {
    return this._localeData[this._locale] ?? {};
  }
  _loadLocaleData(locale, localeData) {
    const maybeLocaleData = this._localeData[locale];
    if (!maybeLocaleData) {
      this._localeData[locale] = localeData;
    } else {
      Object.assign(maybeLocaleData, localeData);
    }
  }
  /**
   * @deprecated Plurals automatically used from Intl.PluralRules you can safely remove this call. Deprecated in v4
   */
  // @ts-ignore deprecated, so ignore the reported error
  loadLocaleData(localeOrAllData, localeData) {
    if (localeData != null) {
      this._loadLocaleData(localeOrAllData, localeData);
    } else {
      Object.keys(localeOrAllData).forEach(
        (locale) => this._loadLocaleData(locale, localeOrAllData[locale])
      );
    }
    this.emit("change");
  }
  _load(locale, messages) {
    const maybeMessages = this._messages[locale];
    if (!maybeMessages) {
      this._messages[locale] = messages;
    } else {
      Object.assign(maybeMessages, messages);
    }
  }
  load(localeOrMessages, messages) {
    if (typeof localeOrMessages == "string" && typeof messages === "object") {
      this._load(localeOrMessages, messages);
    } else {
      Object.entries(localeOrMessages).forEach(
        ([locale, messages2]) => this._load(locale, messages2)
      );
    }
    this.emit("change");
  }
  /**
   * @param options {@link LoadAndActivateOptions}
   */
  loadAndActivate({ locale, locales, messages }) {
    this._locale = locale;
    this._locales = locales || void 0;
    this._messages[this._locale] = messages;
    this.emit("change");
  }
  activate(locale, locales) {
    if (process.env.NODE_ENV !== "production") {
      if (!this._messages[locale]) {
        console.warn(`Messages for locale "${locale}" not loaded.`);
      }
    }
    this._locale = locale;
    this._locales = locales;
    this.emit("change");
  }
  _(id, values, options) {
    let message = options?.message;
    if (!isString(id)) {
      values = id.values || values;
      message = id.message;
      id = id.id;
    }
    const messageForId = this.messages[id];
    const messageMissing = messageForId === void 0;
    const missing = this._missing;
    if (missing && messageMissing) {
      return isFunction(missing) ? missing(this._locale, id) : missing;
    }
    if (messageMissing) {
      this.emit("missing", { id, locale: this._locale });
    }
    let translation = messageForId || message || id;
    if (process.env.NODE_ENV !== "production") {
      translation = isString(translation) ? compileMessage.compileMessage(translation) : translation;
    }
    if (isString(translation) && UNICODE_REGEX.test(translation))
      return JSON.parse(`"${translation}"`);
    if (isString(translation))
      return translation;
    return interpolate(
      translation,
      this._locale,
      this._locales
    )(values, options?.formats);
  }
  date(value, format) {
    return date(this._locales || this._locale, value, format);
  }
  number(value, format) {
    return number(this._locales || this._locale, value, format);
  }
}
function setupI18n(params = {}) {
  return new I18n(params);
}

const i18n = setupI18n();

exports.I18n = I18n;
exports.formats = formats;
exports.i18n = i18n;
exports.setupI18n = setupI18n;
