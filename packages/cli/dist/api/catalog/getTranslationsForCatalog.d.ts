import { Catalog } from "../catalog";
import { FallbackLocales } from "@lingui/conf";
export type TranslationMissingEvent = {
    source: string;
    id: string;
};
export type GetTranslationsOptions = {
    sourceLocale: string;
    fallbackLocales: FallbackLocales;
    onMissing?: (message: TranslationMissingEvent) => void;
};
export declare function getTranslationsForCatalog(catalog: Catalog, locale: string, options: GetTranslationsOptions): Promise<{
    [id: string]: string;
}>;
