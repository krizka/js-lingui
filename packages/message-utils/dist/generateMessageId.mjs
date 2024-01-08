function generateMessageId(msg, context = "") {
  return msg + (context || "");
}

export { generateMessageId };
