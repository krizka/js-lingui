'use strict';

const parser = require('@messageformat/parser');
const pluralsCldr = require('plurals-cldr');
const PO = require('pofile');
const gettextPlurals = require('node-gettext/lib/plurals');
const generateMessageId = require('@lingui/message-utils/generateMessageId');
const formatPo = require('@lingui/format-po');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const pluralsCldr__default = /*#__PURE__*/_interopDefaultCompat(pluralsCldr);
const PO__default = /*#__PURE__*/_interopDefaultCompat(PO);
const gettextPlurals__default = /*#__PURE__*/_interopDefaultCompat(gettextPlurals);

function stringifyICUCase(icuCase) {
  return icuCase.tokens.map((token) => {
    if (token.type === "content") {
      return token.value;
    } else if (token.type === "octothorpe") {
      return "#";
    } else if (token.type === "argument") {
      return "{" + token.arg + "}";
    } else {
      console.warn(
        `Unexpected token "${token}" while stringifying plural case "${icuCase}". Token will be ignored.`
      );
      return "";
    }
  }).join("");
}
const ICU_PLURAL_REGEX = /^{.*, plural, .*}$/;
const ICU_SELECT_REGEX = /^{.*, select(Ordinal)?, .*}$/;
const LINE_ENDINGS = /\r?\n/g;
const CTX_PREFIX = "js-lingui:";
function serializePlurals(item, message, id, isGeneratedId, options) {
  const icuMessage = message.message;
  if (!icuMessage) {
    return item;
  }
  const _simplifiedMessage = icuMessage.replace(LINE_ENDINGS, " ");
  if (ICU_PLURAL_REGEX.test(_simplifiedMessage)) {
    try {
      const messageAst = parser.parse(icuMessage)[0];
      if (messageAst.cases.some(
        (icuCase) => icuCase.tokens.some((token) => token.type === "plural")
      )) {
        console.warn(
          `Nested plurals cannot be expressed with gettext plurals. Message with key "%s" will not be saved correctly.`,
          id
        );
      }
      const ctx = new URLSearchParams({
        pluralize_on: messageAst.arg
      });
      if (isGeneratedId) {
        item.msgid = stringifyICUCase(messageAst.cases[0]);
        item.msgid_plural = stringifyICUCase(
          messageAst.cases[messageAst.cases.length - 1]
        );
        ctx.set("icu", icuMessage);
      } else {
        item.msgid_plural = id + "_plural";
      }
      ctx.sort();
      item.extractedComments.push(CTX_PREFIX + ctx.toString());
      if (message.translation?.length > 0) {
        const ast = parser.parse(message.translation)[0];
        if (ast.cases == null) {
          console.warn(
            `Found translation without plural cases for key "${id}". This likely means that a translated .po file misses multiple msgstr[] entries for the key. Translation found: "${message.translation}"`
          );
          item.msgstr = [message.translation];
        } else {
          item.msgstr = ast.cases.map(stringifyICUCase);
        }
      }
    } catch (e) {
      console.error(`Error parsing message ICU for key "${id}":`, e);
    }
  } else {
    if (!options.disableSelectWarning && ICU_SELECT_REGEX.test(_simplifiedMessage)) {
      console.warn(
        `ICU 'select' and 'selectOrdinal' formats cannot be expressed natively in gettext format. Item with key "%s" will be included in the catalog as raw ICU message. To disable this warning, include '{ disableSelectWarning: true }' in the config's 'formatOptions'`,
        id
      );
    }
    item.msgstr = [message.translation];
  }
  return item;
}
const getPluralCases = (lang) => {
  const [correctLang] = lang.split(/[-_]/g);
  const gettextPluralsInfo = gettextPlurals__default[correctLang];
  return gettextPluralsInfo?.examples.map(
    (pluralCase) => pluralsCldr__default(correctLang, pluralCase.sample)
  );
};
const convertPluralsToICU = (item, pluralForms, lang) => {
  const translationCount = item.msgstr.length;
  const messageKey = item.msgid;
  if (translationCount <= 1 && !item.msgid_plural) {
    return;
  }
  if (!item.msgid_plural) {
    console.warn(
      `Multiple translations for item with key "%s" but missing 'msgid_plural' in catalog "${lang}". This is not supported and the plural cases will be ignored.`,
      messageKey
    );
    return;
  }
  const contextComment = item.extractedComments.find((comment) => comment.startsWith(CTX_PREFIX))?.substr(CTX_PREFIX.length);
  const ctx = new URLSearchParams(contextComment);
  if (contextComment != null) {
    item.extractedComments = item.extractedComments.filter(
      (comment) => !comment.startsWith(CTX_PREFIX)
    );
  }
  const storedICU = ctx.get("icu");
  if (storedICU != null) {
    item.msgid = storedICU;
  }
  if (item.msgstr.every((str) => str.length === 0)) {
    return;
  }
  if (pluralForms == null) {
    console.warn(
      `Multiple translations for item with key "%s" in language "${lang}", but no plural cases were found. This prohibits the translation of .po plurals into ICU plurals. Pluralization will not work for this key.`,
      messageKey
    );
    return;
  }
  const pluralCount = pluralForms.length;
  if (translationCount > pluralCount) {
    console.warn(
      `More translations provided (${translationCount}) for item with key "%s" in language "${lang}" than there are plural cases available (${pluralCount}). This will result in not all translations getting picked up.`,
      messageKey
    );
  }
  const pluralClauses = item.msgstr.map((str, index) => pluralForms[index] + " {" + str + "}").join(" ");
  let pluralizeOn = ctx.get("pluralize_on");
  if (!pluralizeOn) {
    console.warn(
      `Unable to determine plural placeholder name for item with key "%s" in language "${lang}" (should be stored in a comment starting with "#. ${CTX_PREFIX}"), assuming "count".`,
      messageKey
    );
    pluralizeOn = "count";
  }
  item.msgstr = ["{" + pluralizeOn + ", plural, " + pluralClauses + "}"];
};
function formatter(options = {}) {
  options = {
    origins: true,
    lineNumbers: true,
    ...options
  };
  const formatter2 = formatPo.formatter(options);
  return {
    catalogExtension: ".po",
    templateExtension: ".pot",
    parse(content, ctx) {
      const po = PO__default.parse(content);
      let pluralForms = getPluralCases(po.headers.Language);
      po.items.forEach((item) => {
        convertPluralsToICU(item, pluralForms, po.headers.Language);
      });
      return formatter2.parse(po.toString(), ctx);
    },
    serialize(catalog, ctx) {
      const po = PO__default.parse(formatter2.serialize(catalog, ctx));
      po.items = po.items.map((item) => {
        const isGeneratedId = !item.extractedComments.includes(
          "js-lingui-explicit-id"
        );
        const id = isGeneratedId ? generateMessageId.generateMessageId(item.msgid, item.msgctxt) : item.msgid;
        const message = catalog[id];
        return serializePlurals(item, message, id, isGeneratedId, options);
      });
      return po.toString();
    }
  };
}

exports.formatter = formatter;
