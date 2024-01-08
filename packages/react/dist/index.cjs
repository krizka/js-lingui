'use strict';

const React = require('react');
const server = require('./server.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const React__default = /*#__PURE__*/_interopDefaultCompat(React);

const LinguiContext = React__default.createContext(null);
function useLingui() {
  const context = React__default.useContext(LinguiContext);
  if (process.env.NODE_ENV !== "production") {
    if (context == null) {
      throw new Error("useLingui hook was used without I18nProvider.");
    }
  }
  return context;
}
const I18nProvider = ({
  i18n,
  defaultComponent,
  children
}) => {
  const latestKnownLocale = React__default.useRef(i18n.locale);
  const makeContext = React__default.useCallback(
    () => ({
      i18n,
      defaultComponent,
      _: i18n.t.bind(i18n)
    }),
    [i18n, defaultComponent]
  );
  const [context, setContext] = React__default.useState(makeContext());
  React__default.useEffect(() => {
    const updateContext = () => {
      latestKnownLocale.current = i18n.locale;
      setContext(makeContext());
    };
    const unsubscribe = i18n.on("change", updateContext);
    if (latestKnownLocale.current !== i18n.locale) {
      updateContext();
    }
    return unsubscribe;
  }, [i18n, makeContext]);
  if (!latestKnownLocale.current) {
    process.env.NODE_ENV === "development" && console.log(
      "I18nProvider rendered `null`. A call to `i18n.activate` needs to happen in order for translations to be activated and for the I18nProvider to render.This is not an error but an informational message logged only in development."
    );
    return null;
  }
  return /* @__PURE__ */ React__default.createElement(LinguiContext.Provider, { value: context }, children);
};

function Trans(props) {
  const lingui = useLingui();
  return React__default.createElement(server.TransNoContext, { ...props, lingui });
}

exports.I18nProvider = I18nProvider;
exports.LinguiContext = LinguiContext;
exports.Trans = Trans;
exports.useLingui = useLingui;
