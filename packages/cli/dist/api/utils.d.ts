export declare const PATHSEP = "/";
export declare function prettyOrigin(origins: [filename: string, line?: number][]): string;
export declare function replacePlaceholders(input: string, values: Record<string, string>): string;
export declare function readFile(fileName: string): Promise<string | undefined>;
export declare function isDirectory(filePath: string): boolean;
export declare function writeFile(fileName: string, content: string): Promise<void>;
export declare function writeFileIfChanged(filename: string, newContent: string): Promise<void>;
export declare function hasYarn(): boolean;
export declare function makeInstall(packageName: string, dev?: boolean): string;
/**
 * Normalize Windows backslashes in path so they look always as posix
 */
export declare function normalizeSlashes(path: string): string;
/**
 * Remove ./ at the beginning: ./relative  => relative
 *                             relative    => relative
 * Preserve directories:       ./relative/ => relative/
 * Preserve absolute paths:    /absolute/path => /absolute/path
 */
export declare function normalizeRelativePath(sourcePath: string): string;
