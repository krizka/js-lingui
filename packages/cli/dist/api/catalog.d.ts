import * as R from "ramda";
import { LinguiConfigNormalized, OrderBy } from "@lingui/conf";
import { FormatterWrapper } from "./formats";
import { CliExtractOptions } from "../lingui-extract";
import { CliExtractTemplateOptions } from "../lingui-extract-template";
import { CompiledCatalogNamespace } from "./compile";
import { GetTranslationsOptions } from "./catalog/getTranslationsForCatalog";
import { AllCatalogsType, CatalogType, ExtractedCatalogType, ExtractedMessageType } from "./types";
export type MakeOptions = CliExtractOptions & {
    orderBy?: OrderBy;
};
export type MakeTemplateOptions = CliExtractTemplateOptions & {
    orderBy?: OrderBy;
};
export type MergeOptions = {
    overwrite?: boolean;
    files?: string[];
};
export type CatalogProps = {
    name?: string;
    path: string;
    include: Array<string>;
    exclude?: Array<string>;
    templatePath?: string;
    format: FormatterWrapper;
};
export declare class Catalog {
    config: LinguiConfigNormalized;
    name?: string;
    path: string;
    include: Array<string>;
    exclude: Array<string>;
    format: FormatterWrapper;
    templateFile?: string;
    constructor({ name, path, include, templatePath, format, exclude }: CatalogProps, config: LinguiConfigNormalized);
    getFilename(locale: string): string;
    make(options: MakeOptions): Promise<AllCatalogsType | false>;
    makeTemplate(options: MakeTemplateOptions): Promise<CatalogType | false>;
    /**
     * Collect messages from source paths. Return a raw message catalog as JSON.
     */
    collect(options?: {
        files?: string[];
    }): Promise<ExtractedCatalogType | undefined>;
    merge(prevCatalogs: AllCatalogsType, nextCatalog: ExtractedCatalogType, options: MergeOptions): Record<string, CatalogType<{
        [x: string]: unknown;
    }>>;
    getTranslations(locale: string, options: GetTranslationsOptions): Promise<{
        [id: string]: string;
    }>;
    write(locale: string, messages: CatalogType): Promise<[created: boolean, filename: string]>;
    writeTemplate(messages: CatalogType): Promise<void>;
    writeCompiled(locale: string, compiledCatalog: string, namespace?: CompiledCatalogNamespace): Promise<string>;
    read(locale: string): Promise<CatalogType>;
    readAll(): Promise<AllCatalogsType>;
    readTemplate(): Promise<CatalogType>;
    get sourcePaths(): string[];
    get localeDir(): string;
    get locales(): string[];
}
export declare const cleanObsolete: <K extends ExtractedMessageType<{
    [x: string]: unknown;
}>[] | R.Dictionary<ExtractedMessageType<{
    [x: string]: unknown;
}>>>(source: K) => K extends (infer U)[] ? U[] : K extends R.Dictionary<infer U_1> ? R.Dictionary<U_1> : never;
export declare function order<T extends ExtractedCatalogType>(by: OrderBy): (catalog: T) => T;
export declare function orderByMessage<T extends ExtractedCatalogType>(messages: T): T;
