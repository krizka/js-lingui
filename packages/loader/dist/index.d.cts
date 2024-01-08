import { LoaderDefinitionFunction } from 'webpack';

type LinguiLoaderOptions = {
    config?: string;
};
declare const loader: LoaderDefinitionFunction<LinguiLoaderOptions>;

export { loader as default };
