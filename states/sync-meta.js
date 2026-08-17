import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
const emptyMeta = () => ({
    dirty: false,
    lastSyncedRemoteUpdatedAt: undefined,
    lastSuccessfulSyncAt: undefined,
    lastError: undefined,
    backup: undefined,
});
export const syncMeta$ = observable({
    settings: emptyMeta(),
    bookmarks: emptyMeta(),
    userStyles: emptyMeta(),
});
const normalizeSyncMeta = (data) => ({
    settings: { ...emptyMeta(), ...data?.settings },
    bookmarks: { ...emptyMeta(), ...data?.bookmarks },
    userStyles: { ...emptyMeta(), ...data?.userStyles },
});
syncObservable(syncMeta$, {
    persist: {
        name: 'sync-meta',
        plugin: ObservablePersistMMKV,
        transform: {
            load: normalizeSyncMeta,
        },
    },
});
