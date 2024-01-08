import { CatalogFormatter } from '@lingui/conf';

type PoFormatterOptions = {
    /**
     * Print places where message is used
     *
     * @default true
     */
    origins?: boolean;
    /**
     * Print line numbers in origins
     *
     * @default true
     */
    lineNumbers?: boolean;
    /**
     * Print `js-lingui-id: Xs4as` statement in extracted comments section
     *
     * @default false
     */
    printLinguiId?: boolean;
    /**
     * By default, the po-formatter treats the pair `msgid` + `msgctx` as the source
     * for generating an ID by hashing its value.
     *
     * For messages with explicit IDs, the formatter adds a special comment `js-lingui-explicit-id` as a flag.
     * When this flag is present, the formatter will use the `msgid` as-is without any additional processing.
     *
     * Set this option to true if you exclusively use explicit-ids in your project.
     *
     * https://lingui.dev/tutorials/explicit-vs-generated-ids#using-custom-id
     *
     * @default false
     */
    explicitIdAsDefault?: boolean;
};
declare function formatter(options?: PoFormatterOptions): CatalogFormatter;

export { type PoFormatterOptions, formatter };
