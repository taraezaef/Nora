import { syncState, when } from '@legendapp/state';
import { normalizeUserStyles } from '@/lib/user-styles';
import { getUserStylesSnapshot, userStyles$ } from '@/states/user-styles';
import { syncMeta$ } from '@/states/sync-meta';
import { BaseSyncer } from './base';
class UserStylesSyncer extends BaseSyncer {
    NAME = 'user-styles';
    TABLE_NAME = 'user_styles';
    pushWhenRemoteMissing = true;
    isPersistLoaded = () => when(() => syncState(userStyles$).isPersistLoaded.get() && syncState(syncMeta$).isPersistLoaded.get());
    getValue() {
        return getUserStylesSnapshot();
    }
    setValue(value) {
        userStyles$.assign(normalizeUserStyles(value));
    }
    hasMeaningfulLocalValue() {
        return true;
    }
    getMeta() {
        return syncMeta$.userStyles.get();
    }
    setMeta(meta) {
        syncMeta$.userStyles.assign(meta);
    }
}
export const userStylesSyncer = new UserStylesSyncer();
