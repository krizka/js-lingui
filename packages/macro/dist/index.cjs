'use strict';

const babelPluginMacros = require('babel-plugin-macros');
const conf = require('@lingui/conf');
const types = require('@babel/types');
const generateMessageId = require('@lingui/message-utils/generateMessageId');

const metaOptions = ["id", "comment", "props"];
const escapedMetaOptionsRe = new RegExp(`^_(${metaOptions.join("|")})$`);
class ICUMessageFormat {
  fromTokens(tokens) {
    return (Array.isArray(tokens) ? tokens : [tokens]).map((token) => this.processToken(token)).filter(Boolean).reduce(
      (props, message) => ({
        ...message,
        message: props.message + message.message,
        values: { ...props.values, ...message.values },
        jsxElements: { ...props.jsxElements, ...message.jsxElements }
      }),
      {
        message: "",
        values: {},
        jsxElements: {}
      }
    );
  }
  processToken(token) {
    const jsxElements = {};
    if (token.type === "text") {
      return {
        message: token.value
      };
    } else if (token.type === "arg") {
      if (token.value !== void 0 && types.isJSXEmptyExpression(token.value)) {
        return null;
      }
      const values = token.value !== void 0 ? { [token.name]: token.value } : {};
      switch (token.format) {
        case "plural":
        case "select":
        case "selectordinal":
          const formatOptions = Object.keys(token.options).filter((key) => token.options[key] != null).map((key) => {
            let value = token.options[key];
            key = key.replace(escapedMetaOptionsRe, "$1");
            if (key === "offset") {
              return `offset:${value}`;
            }
            if (typeof value !== "string") {
              const {
                message,
                values: childValues,
                jsxElements: childJsxElements
              } = this.fromTokens(value);
              Object.assign(values, childValues);
              Object.assign(jsxElements, childJsxElements);
              value = message;
            }
            return `${key} {${value}}`;
          }).join(" ");
          return {
            message: `{${token.name}, ${token.format}, ${formatOptions}}`,
            values,
            jsxElements
          };
        default:
          return {
            message: `{${token.name}}`,
            values
          };
      }
    } else if (token.type === "element") {
      let message = "";
      let elementValues = {};
      Object.assign(jsxElements, { [token.name]: token.value });
      token.children.forEach((child) => {
        const {
          message: childMessage,
          values: childValues,
          jsxElements: childJsxElements
        } = this.fromTokens(child);
        message += childMessage;
        Object.assign(elementValues, childValues);
        Object.assign(jsxElements, childJsxElements);
      });
      return {
        message: token.children.length ? `<${token.name}>${message}</${token.name}>` : `<${token.name}/>`,
        values: elementValues,
        jsxElements
      };
    }
    throw new Error(`Unknown token type ${token.type}`);
  }
}

const makeCounter = (index = 0) => () => index++;

const ID = "id";
const MESSAGE = "message";
const COMMENT = "comment";
const EXTRACT_MARK = "i18n";
const CONTEXT = "context";

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const keepSpaceRe$1 = /(?:\\(?:\r\n|\r|\n))+\s+/g;
const keepNewLineRe = /(?:\r\n|\r|\n)+\s+/g;
function normalizeWhitespace$1(text) {
  return text.replace(keepSpaceRe$1, " ").replace(keepNewLineRe, "\n").trim();
}
function buildICUFromTokens(tokens) {
  const messageFormat = new ICUMessageFormat();
  const { message, values } = messageFormat.fromTokens(tokens);
  return { message: normalizeWhitespace$1(message), values };
}
class MacroJs {
  constructor({ types }, opts) {
    // Babel Types
    __publicField$1(this, "types");
    // Identifier of i18n object
    __publicField$1(this, "i18nImportName");
    __publicField$1(this, "stripNonEssentialProps");
    __publicField$1(this, "nameMap");
    __publicField$1(this, "nameMapReversed");
    // Positional expressions counter (e.g. for placeholders `Hello {0}, today is {1}`)
    __publicField$1(this, "_expressionIndex", makeCounter());
    __publicField$1(this, "replacePathWithMessage", (path, tokens, linguiInstance) => {
      const newNode = this.createI18nCall(
        this.createMessageDescriptorFromTokens(tokens, path.node.loc),
        linguiInstance
      );
      path.replaceWith(newNode);
    });
    // Returns a boolean indicating if the replacement requires i18n import
    __publicField$1(this, "replacePath", (path) => {
      this._expressionIndex = makeCounter();
      if (this.types.isCallExpression(path.node) && this.isDefineMessage(path.node.callee)) {
        let descriptor = this.processDescriptor(path.node.arguments[0]);
        path.replaceWith(descriptor);
        return false;
      }
      if (this.types.isTaggedTemplateExpression(path.node) && this.isDefineMessage(path.node.tag)) {
        const tokens2 = this.tokenizeTemplateLiteral(path.node.quasi);
        const descriptor = this.createMessageDescriptorFromTokens(
          tokens2,
          path.node.loc
        );
        path.replaceWith(descriptor);
        return false;
      }
      if (this.types.isCallExpression(path.node) && this.types.isTaggedTemplateExpression(path.parent) && (this.types.isStringLiteral(path.node.arguments[0]) || this.types.isTemplateLiteral(path.node.arguments[0])) && this.isLinguiIdentifier(path.node.callee, "t")) {
        const idTokens = this.types.isTemplateLiteral(path.node.arguments[0]) ? this.tokenizeTemplateLiteral(path.node.arguments[0]) : [
          {
            type: "text",
            value: this.expressionToArgument(path.node.arguments[0])
          }
        ];
        const msgTokens = this.tokenizeTemplateLiteral(path.parent.quasi);
        const descriptor = this.createMessageDescriptorFromIdMsg(
          idTokens,
          msgTokens,
          path.node.loc
        );
        path.replaceWith(descriptor);
        return false;
      }
      if (this.types.isCallExpression(path.node) && this.types.isTaggedTemplateExpression(path.parentPath.node) && this.types.isExpression(path.node.arguments[0]) && this.isLinguiIdentifier(path.node.callee, "t")) {
        const i18nInstance = path.node.arguments[0];
        const tokens2 = this.tokenizeNode(path.parentPath.node);
        this.replacePathWithMessage(path.parentPath, tokens2, i18nInstance);
        return false;
      }
      if (this.types.isCallExpression(path.node) && this.types.isCallExpression(path.parentPath.node) && this.types.isExpression(path.node.arguments[0]) && path.parentPath.node.callee === path.node && this.isLinguiIdentifier(path.node.callee, "t")) {
        const i18nInstance = path.node.arguments[0];
        this.replaceTAsFunction(
          path.parentPath,
          i18nInstance
        );
        return false;
      }
      if (this.types.isCallExpression(path.node) && this.isLinguiIdentifier(path.node.callee, "t")) {
        this.replaceTAsFunction(path);
        return true;
      }
      const tokens = this.tokenizeNode(path.node);
      this.replacePathWithMessage(path, tokens);
      return true;
    });
    /**
     * macro `t` is called with MessageDescriptor, after that
     * we create a new node to append it to i18n._
     */
    __publicField$1(this, "replaceTAsFunction", (path, linguiInstance) => {
      const descriptor = this.processDescriptor(path.node.arguments[0]);
      path.replaceWith(this.createI18nCall(descriptor, linguiInstance));
    });
    /**
     * `processDescriptor` expand macros inside message descriptor.
     * Message descriptor is used in `defineMessage`.
     *
     * {
     *   comment: "Description",
     *   message: plural("value", { one: "book", other: "books" })
     * }
     *
     * ↓ ↓ ↓ ↓ ↓ ↓
     *
     * {
     *   comment: "Description",
     *   id: <hash>
     *   message: "{value, plural, one {book} other {books}}"
     * }
     *
     */
    __publicField$1(this, "processDescriptor", (descriptor_) => {
      const descriptor = descriptor_;
      const messageProperty = this.getObjectPropertyByKey(descriptor, MESSAGE);
      const idProperty = this.getObjectPropertyByKey(descriptor, ID);
      const contextProperty = this.getObjectPropertyByKey(descriptor, CONTEXT);
      const properties = [idProperty];
      if (!this.stripNonEssentialProps) {
        properties.push(contextProperty);
      }
      if (messageProperty) {
        const tokens = this.types.isTemplateLiteral(messageProperty.value) ? this.tokenizeTemplateLiteral(messageProperty.value) : this.tokenizeNode(messageProperty.value, true);
        let messageNode = messageProperty.value;
        if (tokens) {
          const { message, values } = buildICUFromTokens(tokens);
          messageNode = this.types.stringLiteral(message);
          properties.push(this.createValuesProperty(values));
        }
        if (!this.stripNonEssentialProps) {
          properties.push(
            this.createObjectProperty(MESSAGE, messageNode)
          );
        }
        if (!idProperty && this.types.isStringLiteral(messageNode)) {
          const context = contextProperty && this.getTextFromExpression(contextProperty.value);
          properties.push(this.createIdProperty(messageNode.value, context));
        }
      }
      if (!this.stripNonEssentialProps) {
        properties.push(this.getObjectPropertyByKey(descriptor, COMMENT));
      }
      return this.createMessageDescriptor(properties, descriptor.loc);
    });
    this.types = types;
    this.i18nImportName = opts.i18nImportName;
    this.stripNonEssentialProps = opts.stripNonEssentialProps;
    this.nameMap = opts.nameMap;
    this.nameMapReversed = Array.from(opts.nameMap.entries()).reduce(
      (map, [key, value]) => map.set(value, key),
      /* @__PURE__ */ new Map()
    );
  }
  createIdProperty(message, context) {
    return this.createObjectProperty(
      ID,
      this.types.stringLiteral(generateMessageId.generateMessageId(message, context))
    );
  }
  createValuesProperty(values) {
    const valuesObject = Object.keys(values).map(
      (key) => this.types.objectProperty(this.types.identifier(key), values[key])
    );
    if (!valuesObject.length)
      return;
    return this.types.objectProperty(
      this.types.identifier("values"),
      this.types.objectExpression(valuesObject)
    );
  }
  tokenizeNode(node, ignoreExpression = false) {
    if (this.isI18nMethod(node)) {
      return this.tokenizeTemplateLiteral(node);
    } else if (this.isChoiceMethod(node)) {
      return [this.tokenizeChoiceComponent(node)];
    } else if (!ignoreExpression) {
      return [this.tokenizeExpression(node)];
    }
  }
  /**
   * `node` is a TemplateLiteral. node.quasi contains
   * text chunks and node.expressions contains expressions.
   * Both arrays must be zipped together to get the final list of tokens.
   */
  tokenizeTemplateLiteral(node) {
    const tpl = this.types.isTaggedTemplateExpression(node) ? node.quasi : node;
    const expressions = tpl.expressions;
    return tpl.quasis.flatMap((text, i) => {
      const value = /\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}/g.test(text.value.raw) ? text.value.cooked : text.value.raw;
      let argTokens = [];
      const currExp = expressions[i];
      if (currExp) {
        argTokens = this.types.isCallExpression(currExp) ? this.tokenizeNode(currExp) : [this.tokenizeExpression(currExp)];
      }
      const textToken = {
        type: "text",
        value: this.clearBackslashes(value)
      };
      return [...value ? [textToken] : [], ...argTokens];
    });
  }
  tokenizeChoiceComponent(node) {
    const name = node.callee.name;
    const format = (this.nameMapReversed.get(name) || name).toLowerCase();
    const token = {
      ...this.tokenizeExpression(node.arguments[0]),
      format,
      options: {
        offset: void 0
      }
    };
    const props = node.arguments[1].properties;
    for (const attr of props) {
      const { key, value: attrValue } = attr;
      const name2 = this.types.isNumericLiteral(key) ? `=${key.value}` : key.name || key.value;
      if (format !== "select" && name2 === "offset") {
        token.options.offset = attrValue.value;
      } else {
        let value;
        if (this.types.isTemplateLiteral(attrValue)) {
          value = this.tokenizeTemplateLiteral(attrValue);
        } else if (this.types.isCallExpression(attrValue)) {
          value = this.tokenizeNode(attrValue);
        } else if (this.types.isStringLiteral(attrValue)) {
          value = attrValue.value;
        } else if (this.types.isExpression(attrValue)) {
          value = this.tokenizeExpression(attrValue);
        } else {
          value = attrValue.value;
        }
        token.options[name2] = value;
      }
    }
    return token;
  }
  tokenizeExpression(node) {
    return {
      type: "arg",
      name: this.expressionToArgument(node),
      value: node
    };
  }
  expressionToArgument(exp) {
    if (this.types.isIdentifier(exp)) {
      return exp.name;
    } else if (this.types.isStringLiteral(exp)) {
      return exp.value;
    } else {
      return String(this._expressionIndex());
    }
  }
  /**
   * We clean '//\` ' to just '`'
   */
  clearBackslashes(value) {
    return value.replace(/\\`/g, "`");
  }
  createI18nCall(messageDescriptor, linguiInstance) {
    return this.types.callExpression(
      this.types.memberExpression(
        linguiInstance ?? this.types.identifier(this.i18nImportName),
        this.types.identifier("_")
      ),
      [messageDescriptor]
    );
  }
  createMessageDescriptorFromTokens(tokens, oldLoc) {
    const { message, values } = buildICUFromTokens(tokens);
    const properties = [
      this.createIdProperty(message),
      !this.stripNonEssentialProps ? this.createObjectProperty(MESSAGE, this.types.stringLiteral(message)) : null,
      this.createValuesProperty(values)
    ];
    return this.createMessageDescriptor(
      properties,
      // preserve line numbers for extractor
      oldLoc
    );
  }
  createMessageDescriptorFromIdMsg(idTokens, msgTokens, oldLoc) {
    const { message, values } = buildICUFromTokens(msgTokens);
    const { message: id } = buildICUFromTokens(idTokens);
    const properties = [
      this.createObjectProperty(ID, this.types.stringLiteral(id)),
      !this.stripNonEssentialProps ? this.createObjectProperty(MESSAGE, this.types.stringLiteral(message)) : null,
      this.createValuesProperty(values)
    ];
    return this.createMessageDescriptor(
      properties,
      // preserve line numbers for extractor
      oldLoc
    );
  }
  createMessageDescriptor(properties, oldLoc) {
    const newDescriptor = this.types.objectExpression(
      properties.filter(Boolean)
    );
    this.types.addComment(newDescriptor, "leading", EXTRACT_MARK);
    if (oldLoc) {
      newDescriptor.loc = oldLoc;
    }
    return newDescriptor;
  }
  createObjectProperty(key, value) {
    return this.types.objectProperty(this.types.identifier(key), value);
  }
  getObjectPropertyByKey(objectExp, key) {
    return objectExp.properties.find(
      (property) => types.isObjectProperty(property) && this.isLinguiIdentifier(property.key, key)
    );
  }
  /**
   * Custom matchers
   */
  isLinguiIdentifier(node, name) {
    return this.types.isIdentifier(node, {
      name: this.nameMap.get(name) || name
    });
  }
  isDefineMessage(node) {
    return this.isLinguiIdentifier(node, "defineMessage") || this.isLinguiIdentifier(node, "msg");
  }
  isI18nMethod(node) {
    return this.types.isTaggedTemplateExpression(node) && (this.isLinguiIdentifier(node.tag, "t") || this.types.isCallExpression(node.tag) && this.isLinguiIdentifier(node.tag.callee, "t"));
  }
  isChoiceMethod(node) {
    return this.types.isCallExpression(node) && (this.isLinguiIdentifier(node.callee, "plural") || this.isLinguiIdentifier(node.callee, "select") || this.isLinguiIdentifier(node.callee, "selectOrdinal"));
  }
  getTextFromExpression(exp) {
    if (this.types.isStringLiteral(exp)) {
      return exp.value;
    }
    if (this.types.isTemplateLiteral(exp)) {
      if (exp?.quasis.length === 1) {
        return exp.quasis[0]?.value?.cooked;
      }
    }
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const pluralRuleRe = /(_[\d\w]+|zero|one|two|few|many|other)/;
const jsx2icuExactChoice = (value) => value.replace(/_(\d+)/, "=$1").replace(/_(\w+)/, "$1");
const keepSpaceRe = /\s*(?:\r\n|\r|\n)+\s*/g;
const stripAroundTagsRe = /(?:([>}])(?:\r\n|\r|\n)+\s*|(?:\r\n|\r|\n)+\s*(?=[<{]))/g;
function maybeNodeValue(node) {
  if (!node)
    return null;
  if (node.type === "StringLiteral")
    return node.value;
  if (node.type === "JSXAttribute")
    return maybeNodeValue(node.value);
  if (node.type === "JSXExpressionContainer")
    return maybeNodeValue(node.expression);
  if (node.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.raw;
  return null;
}
function normalizeWhitespace(text) {
  return text.replace(stripAroundTagsRe, "$1").replace(keepSpaceRe, " ").replace(/\\n/g, "\n").replace(/\\s/g, " ").replace(/(\s+})/gm, "}").replace(/({\s+)/gm, "{").trim();
}
class MacroJSX {
  constructor({ types }, opts) {
    __publicField(this, "types");
    __publicField(this, "expressionIndex", makeCounter());
    __publicField(this, "elementIndex", makeCounter());
    __publicField(this, "stripNonEssentialProps");
    __publicField(this, "nameMap");
    __publicField(this, "nameMapReversed");
    __publicField(this, "createStringJsxAttribute", (name, value) => {
      return this.types.jsxAttribute(
        this.types.jsxIdentifier(name),
        this.types.jsxExpressionContainer(this.types.stringLiteral(value))
      );
    });
    __publicField(this, "replacePath", (path) => {
      if (!path.isJSXElement()) {
        return path;
      }
      const tokens = this.tokenizeNode(path);
      const messageFormat = new ICUMessageFormat();
      const {
        message: messageRaw,
        values,
        jsxElements
      } = messageFormat.fromTokens(tokens);
      const message = normalizeWhitespace(messageRaw);
      const { attributes, id, comment, context } = this.stripMacroAttributes(
        path
      );
      if (!id && !message) {
        return;
      }
      if (id) {
        attributes.push(
          this.types.jsxAttribute(
            this.types.jsxIdentifier(ID),
            this.types.stringLiteral(id)
          )
        );
      } else {
        attributes.push(
          this.createStringJsxAttribute(ID, generateMessageId.generateMessageId(message, context))
        );
      }
      if (!this.stripNonEssentialProps) {
        if (message) {
          attributes.push(this.createStringJsxAttribute(MESSAGE, message));
        }
        if (comment) {
          attributes.push(
            this.types.jsxAttribute(
              this.types.jsxIdentifier(COMMENT),
              this.types.stringLiteral(comment)
            )
          );
        }
        if (context) {
          attributes.push(
            this.types.jsxAttribute(
              this.types.jsxIdentifier(CONTEXT),
              this.types.stringLiteral(context)
            )
          );
        }
      }
      const valuesObject = Object.keys(values).map(
        (key) => this.types.objectProperty(this.types.identifier(key), values[key])
      );
      if (valuesObject.length) {
        attributes.push(
          this.types.jsxAttribute(
            this.types.jsxIdentifier("values"),
            this.types.jsxExpressionContainer(
              this.types.objectExpression(valuesObject)
            )
          )
        );
      }
      if (Object.keys(jsxElements).length) {
        attributes.push(
          this.types.jsxAttribute(
            this.types.jsxIdentifier("components"),
            this.types.jsxExpressionContainer(
              this.types.objectExpression(
                Object.keys(jsxElements).map(
                  (key) => this.types.objectProperty(
                    this.types.identifier(key),
                    jsxElements[key]
                  )
                )
              )
            )
          )
        );
      }
      const newNode = this.types.jsxElement(
        this.types.jsxOpeningElement(
          this.types.jsxIdentifier("Trans"),
          attributes,
          true
        ),
        null,
        [],
        true
      );
      newNode.loc = path.node.loc;
      path.replaceWith(newNode);
    });
    __publicField(this, "attrName", (names, exclude = false) => {
      const namesRe = new RegExp("^(" + names.join("|") + ")$");
      return (attr) => {
        const name = attr.name.name;
        return exclude ? !namesRe.test(name) : namesRe.test(name);
      };
    });
    __publicField(this, "stripMacroAttributes", (path) => {
      const { attributes } = path.node.openingElement;
      const id = attributes.find(this.attrName([ID]));
      const message = attributes.find(this.attrName([MESSAGE]));
      const comment = attributes.find(this.attrName([COMMENT]));
      const context = attributes.find(this.attrName([CONTEXT]));
      let reserved = [ID, MESSAGE, COMMENT, CONTEXT];
      if (this.isChoiceComponent(path)) {
        reserved = [
          ...reserved,
          "_\\w+",
          "_\\d+",
          "zero",
          "one",
          "two",
          "few",
          "many",
          "other",
          "value",
          "offset"
        ];
      }
      return {
        id: maybeNodeValue(id),
        message: maybeNodeValue(message),
        comment: maybeNodeValue(comment),
        context: maybeNodeValue(context),
        attributes: attributes.filter(this.attrName(reserved, true))
      };
    });
    __publicField(this, "tokenizeNode", (path) => {
      if (this.isTransComponent(path)) {
        return this.tokenizeTrans(path);
      } else if (this.isChoiceComponent(path)) {
        return [this.tokenizeChoiceComponent(path)];
      } else if (path.isJSXElement()) {
        return [this.tokenizeElement(path)];
      } else {
        return [this.tokenizeExpression(path)];
      }
    });
    __publicField(this, "tokenizeTrans", (path) => {
      return path.get("children").flatMap((child) => this.tokenizeChildren(child)).filter(Boolean);
    });
    __publicField(this, "tokenizeChildren", (path) => {
      if (path.isJSXExpressionContainer()) {
        const exp = path.get("expression");
        if (exp.isStringLiteral()) {
          return [this.tokenizeText(exp.node.value.replace(/\n/g, "\\n"))];
        }
        if (exp.isTemplateLiteral()) {
          return this.tokenizeTemplateLiteral(exp);
        }
        if (exp.isConditionalExpression()) {
          return [this.tokenizeConditionalExpression(exp)];
        }
        if (exp.isJSXElement()) {
          return this.tokenizeNode(exp);
        }
        return [this.tokenizeExpression(exp)];
      } else if (path.isJSXElement()) {
        return this.tokenizeNode(path);
      } else if (path.isJSXSpreadChild()) ; else if (path.isJSXText()) {
        return [this.tokenizeText(path.node.value)];
      } else ;
    });
    __publicField(this, "tokenizeChoiceComponent", (path) => {
      const element = path.get("openingElement");
      const name = this.getJsxTagName(path.node);
      const format = (this.nameMapReversed.get(name) || name).toLowerCase();
      const props = element.get("attributes").filter((attr) => {
        return this.attrName(
          [
            ID,
            COMMENT,
            MESSAGE,
            CONTEXT,
            "key",
            // we remove <Trans /> react props that are not useful for translation
            "render",
            "component",
            "components"
          ],
          true
        )(attr.node);
      });
      const token = {
        type: "arg",
        format,
        name: null,
        value: void 0,
        options: {
          offset: void 0
        }
      };
      for (const _attr of props) {
        if (_attr.isJSXSpreadAttribute()) {
          continue;
        }
        const attr = _attr;
        if (this.types.isJSXNamespacedName(attr.node.name)) {
          continue;
        }
        const name2 = attr.node.name.name;
        const value = attr.get("value");
        if (name2 === "value") {
          const exp = value.isLiteral() ? value : value.get("expression");
          token.name = this.expressionToArgument(exp);
          token.value = exp.node;
        } else if (format !== "select" && name2 === "offset") {
          token.options.offset = value.isStringLiteral() || value.isNumericLiteral() ? value.node.value : value.get(
            "expression"
          ).node.value;
        } else {
          let option;
          if (value.isStringLiteral()) {
            option = value.node.extra.raw.replace(
              /(["'])(.*)\1/,
              "$2"
            );
          } else {
            option = this.tokenizeChildren(value);
          }
          if (pluralRuleRe.test(name2)) {
            token.options[jsx2icuExactChoice(name2)] = option;
          } else {
            token.options[name2] = option;
          }
        }
      }
      return token;
    });
    __publicField(this, "tokenizeElement", (path) => {
      const name = this.elementIndex();
      return {
        type: "element",
        name,
        value: {
          ...path.node,
          children: [],
          openingElement: {
            ...path.node.openingElement,
            selfClosing: true
          }
        },
        children: this.tokenizeTrans(path)
      };
    });
    __publicField(this, "tokenizeExpression", (path) => {
      return {
        type: "arg",
        name: this.expressionToArgument(path),
        value: path.node
      };
    });
    __publicField(this, "tokenizeConditionalExpression", (exp) => {
      exp.traverse({
        JSXElement: (el) => {
          if (this.isTransComponent(el) || this.isChoiceComponent(el)) {
            this.replacePath(el);
            el.skip();
          }
        }
      });
      return {
        type: "arg",
        name: this.expressionToArgument(exp),
        value: exp.node
      };
    });
    __publicField(this, "tokenizeText", (value) => {
      return {
        type: "text",
        value
      };
    });
    __publicField(this, "isLinguiComponent", (path, name) => {
      return path.isJSXElement() && this.types.isJSXIdentifier(path.node.openingElement.name, {
        name: this.nameMap.get(name) || name
      });
    });
    __publicField(this, "isTransComponent", (path) => {
      return this.isLinguiComponent(path, "Trans");
    });
    __publicField(this, "isChoiceComponent", (path) => {
      return this.isLinguiComponent(path, "Plural") || this.isLinguiComponent(path, "Select") || this.isLinguiComponent(path, "SelectOrdinal");
    });
    __publicField(this, "getJsxTagName", (node) => {
      if (this.types.isJSXIdentifier(node.openingElement.name)) {
        return node.openingElement.name.name;
      }
    });
    this.types = types;
    this.stripNonEssentialProps = opts.stripNonEssentialProps;
    this.nameMap = opts.nameMap;
    this.nameMapReversed = Array.from(opts.nameMap.entries()).reduce(
      (map, [key, value]) => map.set(value, key),
      /* @__PURE__ */ new Map()
    );
  }
  tokenizeTemplateLiteral(exp) {
    const expressions = exp.get("expressions");
    return exp.get("quasis").flatMap(({ node: text }, i) => {
      const value = /\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}/g.test(text.value.raw) ? text.value.cooked : text.value.raw;
      let argTokens = [];
      const currExp = expressions[i];
      if (currExp) {
        argTokens = currExp.isCallExpression() ? this.tokenizeNode(currExp) : [this.tokenizeExpression(currExp)];
      }
      return [
        ...value ? [this.tokenizeText(this.clearBackslashes(value))] : [],
        ...argTokens
      ];
    });
  }
  expressionToArgument(path) {
    return path.isIdentifier() ? path.node.name : String(this.expressionIndex());
  }
  /**
   * We clean '//\` ' to just '`'
   **/
  clearBackslashes(value) {
    return value.replace(/\\`/g, "`");
  }
}

const jsMacroTags = /* @__PURE__ */ new Set([
  "defineMessage",
  "msg",
  "arg",
  "t",
  "plural",
  "select",
  "selectOrdinal"
]);
const jsxMacroTags = /* @__PURE__ */ new Set(["Trans", "Plural", "Select", "SelectOrdinal"]);
let config;
function getConfig(_config) {
  if (_config) {
    config = _config;
  }
  if (!config) {
    config = conf.getConfig();
  }
  return config;
}
function macro({ references, state, babel, config: config2 }) {
  const opts = config2;
  const {
    i18nImportModule,
    i18nImportName,
    TransImportModule,
    TransImportName
  } = getConfig(opts.linguiConfig).runtimeConfigModule;
  const jsxNodes = /* @__PURE__ */ new Set();
  const jsNodes = /* @__PURE__ */ new Set();
  let needsI18nImport = false;
  let nameMap = /* @__PURE__ */ new Map();
  Object.keys(references).forEach((tagName) => {
    const nodes = references[tagName];
    if (jsMacroTags.has(tagName)) {
      nodes.forEach((path) => {
        nameMap.set(tagName, path.node.name);
        jsNodes.add(path.parentPath);
      });
    } else if (jsxMacroTags.has(tagName)) {
      nodes.forEach((path) => {
        nameMap.set(tagName, path.node.name);
        jsxNodes.add(path.parentPath.parentPath);
      });
    } else {
      throw nodes[0].buildCodeFrameError(`Unknown macro ${tagName}`);
    }
  });
  const stripNonEssentialProps = process.env.NODE_ENV == "production" && !opts.extract;
  const jsNodesArray = Array.from(jsNodes);
  jsNodesArray.filter(isRootPath(jsNodesArray)).forEach((path) => {
    const macro2 = new MacroJs(babel, {
      i18nImportName,
      stripNonEssentialProps,
      nameMap
    });
    try {
      if (macro2.replacePath(path))
        needsI18nImport = true;
    } catch (e) {
      reportUnsupportedSyntax(path, e);
    }
  });
  const jsxNodesArray = Array.from(jsxNodes);
  jsxNodesArray.filter(isRootPath(jsxNodesArray)).forEach((path) => {
    const macro2 = new MacroJSX(babel, { stripNonEssentialProps, nameMap });
    try {
      macro2.replacePath(path);
    } catch (e) {
      reportUnsupportedSyntax(path, e);
    }
  });
  if (needsI18nImport) {
    addImport(babel, state, i18nImportModule, i18nImportName);
  }
  if (jsxNodes.size) {
    addImport(babel, state, TransImportModule, TransImportName);
  }
}
function reportUnsupportedSyntax(path, e) {
  throw path.buildCodeFrameError(
    `Unsupported macro usage. Please check the examples at https://lingui.dev/ref/macro#examples-of-js-macros. 
 If you think this is a bug, fill in an issue at https://github.com/lingui/js-lingui/issues
 
 Error: ${e.message}`
  );
}
function addImport(babel, state, module2, importName) {
  const { types: t } = babel;
  const linguiImport = state.file.path.node.body.find(
    (importNode) => t.isImportDeclaration(importNode) && importNode.source.value === module2 && // https://github.com/lingui/js-lingui/issues/777
    importNode.importKind !== "type"
  );
  const tIdentifier = t.identifier(importName);
  if (linguiImport) {
    if (linguiImport.specifiers.findIndex(
      (specifier) => types.isImportSpecifier(specifier) && types.isIdentifier(specifier.imported, { name: importName })
    ) === -1) {
      linguiImport.specifiers.push(t.importSpecifier(tIdentifier, tIdentifier));
    }
  } else {
    state.file.path.node.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(tIdentifier, tIdentifier)],
        t.stringLiteral(module2)
      )
    );
  }
}
function isRootPath(allPath) {
  return (node) => function traverse(path) {
    if (!path.parentPath) {
      return true;
    } else {
      return !allPath.includes(path.parentPath) && traverse(path.parentPath);
    }
  }(node);
}
[...jsMacroTags, ...jsxMacroTags].forEach((name) => {
  Object.defineProperty(module.exports, name, {
    get() {
      throw new Error(
        `The macro you imported from "@lingui/macro" is being executed outside the context of compilation with babel-plugin-macros. This indicates that you don't have the babel plugin "babel-plugin-macros" configured correctly. Please see the documentation for how to configure babel-plugin-macros properly: https://github.com/kentcdodds/babel-plugin-macros/blob/main/other/docs/user.md`
      );
    }
  });
});
const index = babelPluginMacros.createMacro(macro, {
  configName: "lingui"
});

module.exports = index;
