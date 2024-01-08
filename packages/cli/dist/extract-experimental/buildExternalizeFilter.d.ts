type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
};
export declare function buildExternalizeFilter({ includeDeps, excludeDeps, packageJson, }: {
    includeDeps: string[];
    excludeDeps: string[];
    packageJson: PackageJson;
}): (id: string) => boolean;
export declare function getPackageJson(rootDir: string): Promise<PackageJson>;
export {};
