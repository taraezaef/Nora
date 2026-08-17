import { UI_CHANNEL } from './constants.js';
import { mainWindow } from '../lib/main-window.js';
export const uiClient = new Proxy({}, {
    get(_target, name) {
        return async (...args) => mainWindow.webContents.send(UI_CHANNEL, { name, args });
    },
});
