import React, { ComponentType } from 'react';
import { MessageOptions, I18n } from '@lingui/core';

type TransRenderProps = {
    id: string;
    translation: React.ReactNode;
    children: React.ReactNode;
    message?: string | null;
    /**
     * @deprecated isTranslated prop is undocumented and buggy. It'll be removed in v5 release.
     * */
    isTranslated: boolean;
};
type TransRenderCallbackOrComponent = {
    component?: undefined;
    render?: ((props: TransRenderProps) => React.ReactElement<any, any>) | null;
} | {
    component?: React.ComponentType<TransRenderProps> | null;
    render?: undefined;
};
type TransProps = {
    id: string;
    message?: string;
    values?: Record<string, unknown>;
    components?: {
        [key: string]: React.ElementType | any;
    };
    formats?: MessageOptions["formats"];
    comment?: string;
    children?: React.ReactNode;
} & TransRenderCallbackOrComponent;
/**
 * Version of `<Trans>` component without using a Provider/Context React feature.
 * Primarily made for support React Server Components (RSC)
 *
 * @experimental the api of this component is not stabilized yet.
 */
declare function TransNoContext(props: TransProps & {
    lingui: {
        i18n: I18n;
        defaultComponent?: ComponentType<TransRenderProps>;
    };
}): React.ReactElement<any, any> | null;

export { TransNoContext, type TransProps, type TransRenderCallbackOrComponent, type TransRenderProps };
