'use strict';

const dateFns = require('date-fns');
const PO = require('pofile');
const generateMessageId = require('@lingui/message-utils/generateMessageId');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const PO__default = /*#__PURE__*/_interopDefaultCompat(PO);

const splitOrigin = (origin) => {
  const [file, line] = origin.split(":");
  return [file, line ? Number(line) : null];
};
const joinOrigin = (origin) => origin.join(":");
function getCreateHeaders(language) {
  return {
    "POT-Creation-Date": dateFns.format(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mmxxxx"),
    "MIME-Version": "1.0",
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Transfer-Encoding": "8bit",
    "X-Generator": "@lingui/cli",
    ...language ? { Language: language } : {}
  };
}
const EXPLICIT_ID_FLAG = "js-lingui-explicit-id";
const GENERATED_ID_FLAG = "js-lingui-generated-id";
const serialize = (catalog, options) => {
  return Object.keys(catalog).map((id) => {
    const message = catalog[id];
    const item = new PO__default.Item();
    item.extractedComments = [...message.comments || []];
    item.flags = (message.extra?.flags || []).reduce((acc, flag) => {
      acc[flag] = true;
      return acc;
    }, {});
    {
      item.msgid = id;
    }
    if (message.context) {
      item.msgctxt = message.context;
    }
    item.msgstr = [message.translation];
    item.comments = message.extra?.translatorComments || [];
    if (options.origins !== false) {
      if (message.origin && options.lineNumbers === false) {
        item.references = message.origin.map(([path]) => path);
      } else {
        item.references = message.origin ? message.origin.map(joinOrigin) : [];
      }
    }
    item.obsolete = message.obsolete;
    return item;
  });
};
function deserialize(items, options) {
  return items.reduce((catalog, item) => {
    const message = {
      translation: item.msgstr[0],
      comments: item.extractedComments || [],
      context: item.msgctxt ?? null,
      obsolete: item.flags.obsolete || item.obsolete,
      origin: (item.references || []).map((ref) => splitOrigin(ref)),
      extra: {
        translatorComments: item.comments || [],
        flags: Object.keys(item.flags).map((flag) => flag.trim())
      }
    };
    let id = item.msgid;
    if (options.explicitIdAsDefault ? item.extractedComments.includes(GENERATED_ID_FLAG) : !item.extractedComments.includes(EXPLICIT_ID_FLAG)) {
      id = generateMessageId.generateMessageId(item.msgid, item.msgctxt);
      message.message = item.msgid;
    }
    catalog[id] = message;
    return catalog;
  }, {});
}
function formatter(options = {}) {
  options = {
    origins: true,
    lineNumbers: true,
    ...options
  };
  return {
    catalogExtension: ".po",
    templateExtension: ".pot",
    parse(content) {
      const po = PO__default.parse(content);
      return deserialize(po.items, options);
    },
    serialize(catalog, ctx) {
      let po;
      if (ctx.existing) {
        po = PO__default.parse(ctx.existing);
      } else {
        po = new PO__default();
        po.headers = getCreateHeaders(ctx.locale);
        po.headerOrder = Object.keys(po.headers);
      }
      po.items = serialize(catalog, options);
      return po.toString();
    }
  };
}

exports.formatter = formatter;
