declare function detectFromCookie(key: string): LocaleString;

declare function detectFromPath(localePathIndex: number, location?: Partial<Location>): LocaleString;

declare function detectFromStorage(key: string, options?: {
    useSessionStorage: boolean;
}): LocaleString;

type IE11NavigatorLanguage = {
    userLanguage?: string;
};
declare function detectFromNavigator(navigator?: Partial<Navigator & IE11NavigatorLanguage>): LocaleString;

declare function detectFromSubdomain(localeSubdomainIndex: number, location?: Partial<Location>): LocaleString;

declare function detectHtmlTag(htmlTagIdentifier: string, document?: Partial<Document>): LocaleString;

declare function detectFromUrl(parameter: string, location?: Partial<Location>): LocaleString;

type LocaleString = string;
type DetectParamsFunctions = string;
declare function detect(...args: any[]): LocaleString | null;
declare function multipleDetect(...args: any[]): LocaleString[];

export { type DetectParamsFunctions, type LocaleString, detect, detectFromCookie as fromCookie, detectHtmlTag as fromHtmlTag, detectFromNavigator as fromNavigator, detectFromPath as fromPath, detectFromStorage as fromStorage, detectFromSubdomain as fromSubdomain, detectFromUrl as fromUrl, multipleDetect };
