import { requireNativeModule } from 'expo';
import { isIos } from '@/lib/utils';
const unsupportedError = () => Promise.reject(new Error('In-app purchases are only available on iOS'));
const NoraBilling = isIos
    ? requireNativeModule('NoraBilling')
    : {
        getProducts: unsupportedError,
        purchase: unsupportedError,
        restore: unsupportedError,
        getCurrentEntitlements: unsupportedError,
        manageSubscriptions: unsupportedError,
    };
export default NoraBilling;
