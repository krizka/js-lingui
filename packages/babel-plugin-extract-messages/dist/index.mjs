function collectMessage(path, props, ctx) {
  if (props.id === void 0)
    return;
  const node = path.node;
  const line = node.loc ? node.loc.start.line : null;
  const column = node.loc ? node.loc.start.column : null;
  ctx.opts.onMessageExtracted({
    id: props.id,
    message: props.message,
    context: props.context,
    comment: props.comment,
    origin: [ctx.file.opts.filename, line, column]
  });
}
function getTextFromExpression(t, exp, hub, emitErrorOnVariable = true) {
  if (t.isStringLiteral(exp)) {
    return exp.value;
  }
  if (t.isBinaryExpression(exp)) {
    return getTextFromExpression(
      t,
      exp.left,
      hub,
      emitErrorOnVariable
    ) + getTextFromExpression(
      t,
      exp.right,
      hub,
      emitErrorOnVariable
    );
  }
  if (t.isTemplateLiteral(exp)) {
    if (exp?.quasis.length > 1) {
      console.warn(
        hub.buildError(
          exp,
          "Could not extract from template literal with expressions.",
          SyntaxError
        ).message
      );
      return "";
    }
    return exp.quasis[0]?.value?.cooked;
  }
  if (emitErrorOnVariable) {
    console.warn(
      hub.buildError(
        exp,
        "Only strings or template literals could be extracted.",
        SyntaxError
      ).message
    );
  }
}
function extractFromObjectExpression(t, exp, hub, keys) {
  const props = {};
  exp.properties.forEach(({ key, value }, i) => {
    const name = key.name;
    if (!keys.includes(name))
      return;
    props[name] = getTextFromExpression(t, value, hub);
  });
  return props;
}
const I18N_OBJECT = "i18n";
function hasComment(node, comment) {
  return node.leadingComments && node.leadingComments.some((comm) => comm.value.trim() === comment);
}
function hasIgnoreComment(node) {
  return hasComment(node, "lingui-extract-ignore");
}
function hasI18nComment(node) {
  return hasComment(node, "i18n");
}
function index({ types: t }) {
  let localTransComponentName;
  function isTransComponent(node) {
    return t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name, {
      name: localTransComponentName
    });
  }
  const isI18nMethod = (node) => t.isMemberExpression(node) && (t.isIdentifier(node.object, { name: I18N_OBJECT }) || t.isMemberExpression(node.object) && t.isIdentifier(node.object.property, { name: I18N_OBJECT })) && (t.isIdentifier(node.property, { name: "_" }) || t.isIdentifier(node.property, { name: "t" }));
  const extractFromMessageDescriptor = (path, ctx) => {
    const props = extractFromObjectExpression(t, path.node, ctx.file.hub, [
      "id",
      "message",
      "comment",
      "context"
    ]);
    if (!props.id) {
      console.warn(
        path.buildCodeFrameError("Missing message ID, skipping.").message
      );
      return;
    }
    collectMessage(path, props, ctx);
  };
  return {
    visitor: {
      // Get the local name of Trans component. Usually it's just `Trans`, but
      // it might be different when the import is aliased:
      // import { Trans as T } from '@lingui/react';
      ImportDeclaration(path) {
        const { node } = path;
        const moduleName = node.source.value;
        if (!["@lingui/react", "@lingui/core"].includes(moduleName))
          return;
        const importDeclarations = {};
        if (moduleName === "@lingui/react") {
          node.specifiers.forEach((specifier) => {
            specifier = specifier;
            importDeclarations[specifier.imported.name] = specifier.local.name;
          });
          localTransComponentName = importDeclarations["Trans"] || "Trans";
        }
      },
      // Extract translation from <Trans /> component.
      JSXElement(path, ctx) {
        const { node } = path;
        if (!localTransComponentName || !isTransComponent(node))
          return;
        const attrs = node.openingElement.attributes || [];
        const props = attrs.reduce((acc, item) => {
          const key = item.name.name;
          if (key === "id" || key === "message" || key === "comment" || key === "context") {
            if (t.isStringLiteral(item.value)) {
              acc[key] = item.value.value;
            } else if (t.isJSXExpressionContainer(item.value) && t.isStringLiteral(item.value.expression)) {
              acc[key] = item.value.expression.value;
            }
          }
          return acc;
        }, {});
        if (!props.id) {
          const idProp = attrs.filter((item) => item.name.name === "id")[0];
          if (idProp === void 0 || t.isLiteral(props.id)) {
            console.warn(
              path.buildCodeFrameError("Missing message ID, skipping.").message
            );
          }
          return;
        }
        collectMessage(path, props, ctx);
      },
      CallExpression(path, ctx) {
        if ([path.node, path.parent].some((node) => hasIgnoreComment(node))) {
          return;
        }
        const firstArgument = path.get("arguments")[0];
        if (!isI18nMethod(path.node.callee)) {
          return;
        }
        if (hasI18nComment(firstArgument.node)) {
          return;
        }
        if (firstArgument.isObjectExpression()) {
          extractFromMessageDescriptor(firstArgument, ctx);
          return;
        } else {
          let props = {
            id: getTextFromExpression(
              t,
              firstArgument.node,
              ctx.file.hub,
              false
            )
          };
          if (!props.id) {
            return;
          }
          const msgDescArg = path.node.arguments[2];
          if (t.isObjectExpression(msgDescArg)) {
            props = {
              ...props,
              ...extractFromObjectExpression(t, msgDescArg, ctx.file.hub, [
                "message",
                "comment",
                "context"
              ])
            };
          }
          collectMessage(path, props, ctx);
        }
      },
      StringLiteral(path, ctx) {
        if (!hasI18nComment(path.node)) {
          return;
        }
        const props = {
          id: path.node.value
        };
        if (!props.id) {
          console.warn(
            path.buildCodeFrameError("Empty StringLiteral, skipping.").message
          );
          return;
        }
        collectMessage(path, props, ctx);
      },
      // Extract message descriptors
      ObjectExpression(path, ctx) {
        if (!hasI18nComment(path.node))
          return;
        extractFromMessageDescriptor(path, ctx);
      }
    }
  };
}

export { index as default };
