"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFallbackListForLocale = void 0;
function getFallbackListForLocale(fallbackLocales, locale) {
    const fL = [];
    if (fallbackLocales === null || fallbackLocales === void 0 ? void 0 : fallbackLocales[locale]) {
        const mapping = fallbackLocales === null || fallbackLocales === void 0 ? void 0 : fallbackLocales[locale];
        Array.isArray(mapping) ? fL.push(...mapping) : fL.push(mapping);
    }
    if ((fallbackLocales === null || fallbackLocales === void 0 ? void 0 : fallbackLocales.default) && locale !== (fallbackLocales === null || fallbackLocales === void 0 ? void 0 : fallbackLocales.default)) {
        fL.push(fallbackLocales === null || fallbackLocales === void 0 ? void 0 : fallbackLocales.default);
    }
    return fL;
}
exports.getFallbackListForLocale = getFallbackListForLocale;
