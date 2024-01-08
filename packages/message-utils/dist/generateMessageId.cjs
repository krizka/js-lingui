'use strict';

function generateMessageId(msg, context = "") {
  return msg + (context || "");
}

exports.generateMessageId = generateMessageId;
