import { ParserOptions } from "@babel/core";
import type { ExtractorType } from "@lingui/conf";
import { ExtractedMessage, ExtractorCtx } from "@lingui/conf";
/**
 * @public
 *
 * Low level function used in default Lingui extractor.
 * This function setup source maps and lingui plugins needed for
 * extraction process but leaving `parserOptions` up to userland implementation.
 *
 *
 * @example
 * ```ts
 * const extractor: ExtractorType = {
 *   ...
 *   async extract(filename, code, onMessageExtracted, ctx) {
 *     return extractFromFileWithBabel(filename, code, onMessageExtracted, ctx, {
 *       // https://babeljs.io/docs/babel-parser#plugins
 *       plugins: [
 *         "decorators-legacy",
 *         "typescript",
 *         "jsx",
 *       ],
 *     })
 *   },
 * }
 * ```
 */
export declare function extractFromFileWithBabel(filename: string, code: string, onMessageExtracted: (msg: ExtractedMessage) => void, ctx: ExtractorCtx, parserOpts: ParserOptions): Promise<void>;
declare const extractor: ExtractorType;
export default extractor;
