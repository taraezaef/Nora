import { MAIN_CHANNEL } from 'main/ipc/constants';
export const mainClient = new Proxy({}, {
    get(_target, name) {
        return async (...args) => window.electron.ipcRenderer.invoke(MAIN_CHANNEL, name, ...args);
    },
});
