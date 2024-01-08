import React, { ComponentType, FunctionComponent } from 'react';
import { I18n } from '@lingui/core';
import { TransRenderProps, TransProps } from './server.js';
export { TransRenderCallbackOrComponent } from './server.js';

type I18nContext = {
    i18n: I18n;
    _: I18n["_"];
    defaultComponent?: ComponentType<TransRenderProps>;
};
type I18nProviderProps = Omit<I18nContext, "_"> & {
    children?: React.ReactNode;
};
declare const LinguiContext: React.Context<I18nContext | null>;
declare function useLingui(): I18nContext;
declare const I18nProvider: FunctionComponent<I18nProviderProps>;

declare function Trans(props: TransProps): React.ReactElement<any, any> | null;

export { type I18nContext, I18nProvider, type I18nProviderProps, LinguiContext, Trans, TransProps, TransRenderProps, useLingui };
