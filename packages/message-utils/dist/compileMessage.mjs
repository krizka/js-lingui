import { parse } from '@messageformat/parser';

function processTokens(tokens, mapText) {
  if (!tokens.filter((token) => token.type !== "content").length) {
    return tokens.map((token) => mapText(token.value)).join("");
  }
  return tokens.map((token) => {
    if (token.type === "content") {
      return mapText(token.value);
    } else if (token.type === "octothorpe") {
      return "#";
    } else if (token.type === "argument") {
      return [token.arg];
    } else if (token.type === "function") {
      const _param = token?.param?.[0];
      if (_param) {
        return [token.arg, token.key, _param.value.trim()];
      } else {
        return [token.arg, token.key];
      }
    }
    const offset = token.pluralOffset;
    const formatProps = {};
    token.cases.forEach((item) => {
      formatProps[item.key.replace(/^=(.)+/, "$1")] = processTokens(
        item.tokens,
        mapText
      );
    });
    return [
      token.arg,
      token.type,
      {
        offset,
        ...formatProps
      }
    ];
  });
}
function compileMessage(message, mapText = (v) => v) {
  try {
    return processTokens(parse(message), mapText);
  } catch (e) {
    console.error(`${e.message} 

Message: ${message}`);
    return message;
  }
}

export { compileMessage };
