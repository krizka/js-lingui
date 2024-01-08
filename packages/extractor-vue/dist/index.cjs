'use strict';

const compilerSfc = require('@vue/compiler-sfc');
const api = require('@lingui/cli/api');

const vueExtractor = {
  match(filename) {
    return filename.endsWith(".vue");
  },
  async extract(filename, code, onMessageExtracted, ctx) {
    const { descriptor } = compilerSfc.parse(code, {
      sourceMap: true,
      filename,
      ignoreEmpty: true
    });
    const isTsBlock = (block) => block?.lang === "ts";
    const compiledTemplate = descriptor.template && compilerSfc.compileTemplate({
      source: descriptor.template.content,
      filename,
      inMap: descriptor.template.map,
      id: filename,
      compilerOptions: {
        isTS: isTsBlock(descriptor.script) || isTsBlock(descriptor.scriptSetup)
      }
    });
    const targets = [
      [
        descriptor.script?.content,
        descriptor.script?.map,
        isTsBlock(descriptor.script)
      ],
      [
        descriptor.scriptSetup?.content,
        descriptor.scriptSetup?.map,
        isTsBlock(descriptor.scriptSetup)
      ],
      [
        compiledTemplate?.code,
        compiledTemplate?.map,
        isTsBlock(descriptor.script) || isTsBlock(descriptor.scriptSetup)
      ]
    ];
    await Promise.all(
      targets.filter(([source]) => Boolean(source)).map(
        ([source, map, isTs]) => api.extractor.extract(
          filename + (isTs ? ".ts" : ""),
          source,
          onMessageExtracted,
          {
            sourceMaps: map,
            ...ctx
          }
        )
      )
    );
  }
};

exports.vueExtractor = vueExtractor;
