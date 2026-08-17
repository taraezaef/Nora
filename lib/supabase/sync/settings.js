import { syncState, when } from '@legendapp/state';
import { normalizeSettings, settings$ } from '@/states/settings';
import { syncMeta$ } from '@/states/sync-meta';
import { BaseSyncer } from './base';
class SettingsSyncer extends BaseSyncer {
    NAME = 'settings';
    TABLE_NAME = 'settings';
    pushWhenRemoteMissing = true;
    isPersistLoaded = () => when(syncState(settings$).isPersistLoaded);
    getValue() {
        // siteZoom is device-local; never push it to the remote.
        const { siteZoom: _siteZoom, ...rest } = settings$.get();
        return rest;
    }
    setValue(value) {
        // Preserve the device-local siteZoom when applying remote settings.
        const siteZoom = settings$.siteZoom.get();
        settings$.assign(normalizeSettings({ ...value, siteZoom }));
    }
    hasMeaningfulLocalValue() {
        return true;
    }
    getMeta() {
        return syncMeta$.settings.get();
    }
    setMeta(meta) {
        syncMeta$.settings.assign(meta);
    }
}
export const settingsSyncer = new SettingsSyncer();
