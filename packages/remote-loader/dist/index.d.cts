type RemoteLoaderOpts<T> = {
    format?: "minimal";
    fallbackMessages?: string | Record<string, any> | T;
    messages: string | Record<string, any> | T;
};
declare function remoteLoader<T>({ format, fallbackMessages, messages, }: RemoteLoaderOpts<T>): {};

export { remoteLoader };
