const isDevRuntime = () => {
    if (typeof __DEV__ !== 'undefined') {
        return __DEV__;
    }
    if (typeof process !== 'undefined' && typeof process.env?.NODE_ENV === 'string') {
        return process.env.NODE_ENV !== 'production';
    }
    return false;
};
const writeLog = (method, prefix, message, payload) => {
    const line = `${prefix} ${message}`;
    switch (method) {
        case 'info':
            if (payload !== undefined) {
                console.info(line, payload);
            }
            else {
                console.info(line);
            }
            return;
        case 'warn':
            if (payload !== undefined) {
                console.warn(line, payload);
            }
            else {
                console.warn(line);
            }
            return;
        case 'error':
            if (payload !== undefined) {
                console.error(line, payload);
            }
            else {
                console.error(line);
            }
            return;
        default:
            if (payload !== undefined) {
                console.log(line, payload);
            }
            else {
                console.log(line);
            }
    }
};
export const createLogger = (scope, options = {}) => {
    const prefix = `[${scope}]`;
    const shouldWrite = () => !options.devOnly || isDevRuntime();
    const emit = (method, message, payload) => {
        if (!shouldWrite()) {
            return;
        }
        writeLog(method, prefix, message, payload);
    };
    return {
        log: (message, payload) => emit('log', message, payload),
        info: (message, payload) => emit('info', message, payload),
        warn: (message, payload) => emit('warn', message, payload),
        error: (message, payload) => emit('error', message, payload),
        child: (childScope) => createLogger(`${scope}:${childScope}`, options),
    };
};
