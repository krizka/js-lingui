import { defineMessage, t } from "@lingui/macro"
import { i18n } from "@lingui/core"

const msg = t`Hello world`

const msg11 = t`jsx.custom.id`

const msg2 = t({
  message: "Hello world",
  context: "custom context",
})

const msg21 = t({
  id: 'Hello world',
  message: "Hello world",
})
const msg22 = t('Hello world')``;

const msg3 = t({
  message: "This message has custom id",
  id: "custom.id",
})

const msgDescriptor = defineMessage({
  message: "Message in descriptor",
})

i18n._(msgDescriptor)
