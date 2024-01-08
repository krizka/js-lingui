'use strict';

const React = require('react');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const React__default = /*#__PURE__*/_interopDefaultCompat(React);

const tagRe = /<([a-zA-Z0-9]+)>(.*?)<\/\1>|<([a-zA-Z0-9]+)\/>/;
const nlRe = /(?:\r\n|\r|\n)/g;
const voidElementTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
  menuitem: true
};
function formatElements(value, elements = {}) {
  const uniqueId = makeCounter(0, "$lingui$");
  const parts = value.replace(nlRe, "").split(tagRe);
  if (parts.length === 1)
    return value;
  const tree = [];
  const before = parts.shift();
  if (before)
    tree.push(before);
  for (const [index, children, after] of getElements(parts)) {
    let element = typeof index !== "undefined" ? elements[index] : void 0;
    if (!element || voidElementTags[element.type] && children) {
      if (!element) {
        console.error(
          `Can't use element at index '${index}' as it is not declared in the original translation`
        );
      } else {
        console.error(
          `${element.type} is a void element tag therefore it must have no children`
        );
      }
      element = React__default.createElement(React__default.Fragment);
    }
    if (Array.isArray(element)) {
      element = React__default.createElement(React__default.Fragment, {}, element);
    }
    tree.push(
      React__default.cloneElement(
        element,
        { key: uniqueId() },
        // format children for pair tags
        // unpaired tags might have children if it's a component passed as a variable
        children ? formatElements(children, elements) : element.props.children
      )
    );
    if (after)
      tree.push(after);
  }
  return tree;
}
function getElements(parts) {
  if (!parts.length)
    return [];
  const [paired, children, unpaired, after] = parts.slice(0, 4);
  const triple = [paired || unpaired, children || "", after];
  return [triple].concat(getElements(parts.slice(4, parts.length)));
}
const makeCounter = (count = 0, prefix = "") => () => `${prefix}_${count++}`;

function TransNoContext(props) {
  const {
    render,
    component,
    id,
    message,
    formats,
    lingui: { i18n, defaultComponent }
  } = props;
  const values = { ...props.values };
  const components = { ...props.components };
  if (values) {
    Object.keys(values).forEach((key) => {
      const value = values[key];
      const valueIsReactEl = React__default.isValidElement(value) || Array.isArray(value) && value.every(React__default.isValidElement);
      if (!valueIsReactEl)
        return;
      const index = Object.keys(components).length;
      components[index] = value;
      values[key] = `<${index}/>`;
    });
  }
  const _translation = i18n && typeof i18n._ === "function" ? i18n._(id, values, { message, formats }) : id;
  const translation = _translation ? formatElements(_translation, components) : null;
  if (render === null || component === null) {
    return translation;
  }
  const FallbackComponent = defaultComponent || RenderFragment;
  const i18nProps = {
    id,
    message,
    translation,
    // TODO vonovak - remove isTranslated prop in v5 release
    isTranslated: id !== translation && message !== translation,
    children: translation
    // for type-compatibility with `component` prop
  };
  if (render && component) {
    console.error(
      "You can't use both `component` and `render` prop at the same time. `component` is ignored."
    );
  } else if (render && typeof render !== "function") {
    console.error(
      `Invalid value supplied to prop \`render\`. It must be a function, provided ${render}`
    );
  } else if (component && typeof component !== "function") {
    console.error(
      `Invalid value supplied to prop \`component\`. It must be a React component, provided ${component}`
    );
    return React__default.createElement(FallbackComponent, i18nProps, translation);
  }
  if (typeof render === "function") {
    return render(i18nProps);
  }
  const Component = component || FallbackComponent;
  return React__default.createElement(Component, i18nProps, translation);
}
const RenderFragment = ({ children }) => {
  return /* @__PURE__ */ React__default.createElement(React__default.Fragment, null, children);
};

exports.TransNoContext = TransNoContext;
