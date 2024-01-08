import { CatalogFormatter } from '@lingui/conf';
import { PoFormatterOptions } from '@lingui/format-po';

type PoGettextFormatterOptions = PoFormatterOptions & {
    disableSelectWarning?: boolean;
};
declare function formatter(options?: PoGettextFormatterOptions): CatalogFormatter;

export { type PoGettextFormatterOptions, formatter };
