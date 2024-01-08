import { GeneratorOptions } from "@babel/generator";
import { CompiledMessage } from "@lingui/message-utils/compileMessage";
export type CompiledCatalogNamespace = "cjs" | "es" | "ts" | "json" | string;
type CompiledCatalogType = {
    [msgId: string]: string;
};
export type CreateCompileCatalogOptions = {
    strict?: boolean;
    namespace?: CompiledCatalogNamespace;
    pseudoLocale?: string;
    compilerBabelOptions?: GeneratorOptions;
};
export declare function createCompiledCatalog(locale: string, messages: CompiledCatalogType, options: CreateCompileCatalogOptions): string;
/**
 * Compile string message into AST tree. Message format is parsed/compiled into
 * JS arrays, which are handled in client.
 */
export declare function compile(message: string, shouldPseudolocalize?: boolean): CompiledMessage;
export {};
