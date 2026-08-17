import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { genId } from '@/lib/utils';
import { normalizeXHomeTimeline } from '@/lib/settings/twitter';
import { normalizeI18nLanguage } from '@/lib/i18n';
import { normalizeCustomSearchProviders, normalizeEnabledSearchProviderIds, normalizeSelectedSearchProviderId, getFaviconUrl, isValidSearchTemplate, } from '@/lib/search';
export const DEFAULT_ANTI_DETECT = {
    customUserAgent: '',
    spoofedOS: 'Windows',
    isProxyEnabled: false,
    proxyHost: '',
    proxyPort: 8080,
    proxyType: 'http',
    proxyUsername: '',
    proxyPassword: '',
    syncTimezone: false,
};
const DEFAULT_PROFILE_ID = 'default';
const DEFAULT_PROFILE = {
    id: DEFAULT_PROFILE_ID,
    name: 'Default',
    color: '#6366f1',
    isDefault: true,
    ...DEFAULT_ANTI_DETECT,
};
const ensureProfiles = (profiles) => {
    const sanitized = (profiles || []).filter((p) => p != null);
    const defaultProfile = sanitized.find((p) => p.id === DEFAULT_PROFILE_ID);
    if (!defaultProfile) {
        return [DEFAULT_PROFILE, ...sanitized];
    }
    return sanitized;
};
const normalizeDesktopLayout = (value) => value === 'on' || value === 'off' ? value : 'auto';
const normalizeSpoofedOS = (value) => {
    return value === 'Android' || value === 'iOS' || value === 'Windows' ? value : DEFAULT_ANTI_DETECT.spoofedOS;
};
const normalizeProxyType = (value) => {
    return value === 'socks4' || value === 'socks5' || value === 'http' ? value : DEFAULT_ANTI_DETECT.proxyType;
};
const normalizeProfilePort = (value) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ANTI_DETECT.proxyPort;
};
const sanitizeProfiles = (profiles) => ensureProfiles((profiles || [])
    .filter((profile) => profile && typeof profile.id === 'string' && typeof profile.name === 'string')
    .map((profile) => ({
    id: profile.id,
    name: profile.name,
    color: typeof profile.color === 'string' ? profile.color : DEFAULT_PROFILE.color,
    customUserAgent: typeof profile.customUserAgent === 'string' ? profile.customUserAgent : DEFAULT_ANTI_DETECT.customUserAgent,
    spoofedOS: normalizeSpoofedOS(profile.spoofedOS),
    isProxyEnabled: typeof profile.isProxyEnabled === 'boolean' ? profile.isProxyEnabled : DEFAULT_ANTI_DETECT.isProxyEnabled,
    proxyHost: typeof profile.proxyHost === 'string' ? profile.proxyHost : DEFAULT_ANTI_DETECT.proxyHost,
    proxyPort: normalizeProfilePort(profile.proxyPort),
    proxyType: normalizeProxyType(profile.proxyType),
    proxyUsername: typeof profile.proxyUsername === 'string' ? profile.proxyUsername : DEFAULT_ANTI_DETECT.proxyUsername,
    proxyPassword: typeof profile.proxyPassword === 'string' ? profile.proxyPassword : DEFAULT_ANTI_DETECT.proxyPassword,
    syncTimezone: typeof profile.syncTimezone === 'boolean' ? profile.syncTimezone : DEFAULT_ANTI_DETECT.syncTimezone,
    ...(profile.isDefault ? { isDefault: true } : {}),
})));
const sanitizeSiteZoom = (siteZoom) => {
    const next = {};
    for (const [site, zoom] of Object.entries(siteZoom || {})) {
        if (typeof zoom === 'number' && Number.isFinite(zoom)) {
            next[site] = zoom;
        }
    }
    return next;
};
/**
 * Build a complete, validated Settings value from a partial one, so a hand
 * edited or older backup file can't leave holes in the store.
 */
export const getSettingsSnapshot = (value = settings$.get()) => {
    const customSearchProviders = normalizeCustomSearchProviders(value?.customSearchProviders);
    const enabledSearchProviderIds = normalizeEnabledSearchProviderIds(value?.enabledSearchProviderIds, customSearchProviders);
    const bool = (input, fallback = false) => (typeof input === 'boolean' ? input : fallback);
    return {
        language: normalizeI18nLanguage(value?.language),
        autoHideHeader: bool(value?.autoHideHeader),
        doubleTapToToggleHeader: bool(value?.doubleTapToToggleHeader),
        hideToolbarWhenScrolled: bool(value?.hideToolbarWhenScrolled),
        headerPosition: value?.headerPosition === 'bottom' ? 'bottom' : 'top',
        theme: value?.theme === 'dark' || value?.theme === 'light' ? value.theme : null,
        openExternalLinkInSystemBrowser: bool(value?.openExternalLinkInSystemBrowser),
        redirectToOldReddit: bool(value?.redirectToOldReddit),
        xDefaultHomeTimeline: normalizeXHomeTimeline(value?.xDefaultHomeTimeline),
        hideXHomeTimelineTabs: bool(value?.hideXHomeTimelineTabs),
        allowHttpWebsite: bool(value?.allowHttpWebsite, true),
        inspectable: bool(value?.inspectable),
        videoEdgeLongPressTo2x: bool(value?.videoEdgeLongPressTo2x, true),
        translateOnDoubleTap: bool(value?.translateOnDoubleTap),
        translationTargetLanguage: typeof value?.translationTargetLanguage === 'string' && value.translationTargetLanguage.trim()
            ? value.translationTargetLanguage
            : null,
        doubleBackToExitApp: bool(value?.doubleBackToExitApp),
        mentionNotificationsEnabled: bool(value?.mentionNotificationsEnabled),
        protectWebRtcIp: bool(value?.protectWebRtcIp, true),
        proxyEnabled: bool(value?.proxyEnabled),
        proxyType: value?.proxyType === 'socks' ? 'socks' : 'http',
        proxyHost: typeof value?.proxyHost === 'string' ? value.proxyHost : '',
        proxyPort: typeof value?.proxyPort === 'string' ? value.proxyPort : '',
        showNewTabButtonInHeader: bool(value?.showNewTabButtonInHeader, true),
        showBackButtonInHeader: bool(value?.showBackButtonInHeader),
        showForwardButtonInHeader: bool(value?.showForwardButtonInHeader),
        showReloadButtonInHeader: bool(value?.showReloadButtonInHeader),
        showScrollButtonInHeader: bool(value?.showScrollButtonInHeader),
        oneHandMode: bool(value?.oneHandMode),
        oneTabPerSite: bool(value?.oneTabPerSite),
        oneProfilePerSite: bool(value?.oneProfilePerSite),
        deckTabWidth: typeof value?.deckTabWidth === 'number' ? value.deckTabWidth : 400,
        sidebarCollapsed: bool(value?.sidebarCollapsed),
        desktopLayout: normalizeDesktopLayout(value?.desktopLayout),
        defaultZoom: typeof value?.defaultZoom === 'number' ? value.defaultZoom : 100,
        siteZoom: sanitizeSiteZoom(value?.siteZoom),
        disabledServicesArr: (value?.disabledServicesArr || []).filter((service) => typeof service === 'string'),
        enabledSearchProviderIds,
        selectedSearchProviderId: normalizeSelectedSearchProviderId(value?.selectedSearchProviderId, enabledSearchProviderIds),
        customSearchProviders,
        profiles: sanitizeProfiles(value?.profiles),
    };
};
export const normalizeSettings = (data) => {
    if (!data) {
        return data;
    }
    if ('profiles' in data) {
        data.profiles = sanitizeProfiles(data.profiles);
    }
    data.customSearchProviders = normalizeCustomSearchProviders(data.customSearchProviders);
    data.enabledSearchProviderIds = normalizeEnabledSearchProviderIds(data.enabledSearchProviderIds, data.customSearchProviders);
    data.selectedSearchProviderId = normalizeSelectedSearchProviderId(data.selectedSearchProviderId, data.enabledSearchProviderIds);
    if (typeof data.videoEdgeLongPressTo2x !== 'boolean') {
        data.videoEdgeLongPressTo2x = true;
    }
    if (typeof data.translateOnDoubleTap !== 'boolean') {
        data.translateOnDoubleTap = data.translateOnTwoFingerTap === true;
    }
    if (typeof data.translationTargetLanguage !== 'string' || !data.translationTargetLanguage.trim()) {
        data.translationTargetLanguage = null;
    }
    if (!('language' in data)) {
        data.language = null;
    }
    else {
        data.language = normalizeI18nLanguage(data.language);
    }
    if (typeof data.doubleBackToExitApp !== 'boolean') {
        data.doubleBackToExitApp = false;
    }
    if (typeof data.mentionNotificationsEnabled !== 'boolean') {
        data.mentionNotificationsEnabled = false;
    }
    data.xDefaultHomeTimeline = normalizeXHomeTimeline(data.xDefaultHomeTimeline);
    if (typeof data.hideXHomeTimelineTabs !== 'boolean') {
        data.hideXHomeTimelineTabs = false;
    }
    if (typeof data.showReloadButtonInHeader !== 'boolean') {
        data.showReloadButtonInHeader = false;
    }
    if (typeof data.doubleTapToToggleHeader !== 'boolean') {
        data.doubleTapToToggleHeader = false;
    }
    if (typeof data.hideToolbarWhenScrolled !== 'boolean') {
        data.hideToolbarWhenScrolled = false;
    }
    if (typeof data.deckTabWidth !== 'number') {
        data.deckTabWidth = 400;
    }
    if (typeof data.sidebarCollapsed !== 'boolean') {
        data.sidebarCollapsed = false;
    }
    data.desktopLayout = normalizeDesktopLayout(data.desktopLayout);
    if (typeof data.oneProfilePerSite !== 'boolean') {
        data.oneProfilePerSite = false;
    }
    if (typeof data.protectWebRtcIp !== 'boolean') {
        data.protectWebRtcIp = true;
    }
    if (typeof data.proxyEnabled !== 'boolean') {
        data.proxyEnabled = false;
    }
    if (data.proxyType !== 'http' && data.proxyType !== 'socks') {
        data.proxyType = 'http';
    }
    if (typeof data.proxyHost !== 'string') {
        data.proxyHost = '';
    }
    if (typeof data.proxyPort !== 'string') {
        data.proxyPort = '';
    }
    if (typeof data.defaultZoom !== 'number') {
        data.defaultZoom = 100;
    }
    if (!data.siteZoom || typeof data.siteZoom !== 'object') {
        data.siteZoom = {};
    }
    return data;
};
export const settings$ = observable({
    language: null,
    autoHideHeader: false,
    doubleTapToToggleHeader: false,
    hideToolbarWhenScrolled: false,
    headerPosition: 'top',
    theme: null,
    openExternalLinkInSystemBrowser: false,
    redirectToOldReddit: false,
    xDefaultHomeTimeline: 'for-you',
    hideXHomeTimelineTabs: false,
    allowHttpWebsite: true,
    inspectable: false,
    videoEdgeLongPressTo2x: true,
    translateOnDoubleTap: false,
    translationTargetLanguage: null,
    doubleBackToExitApp: false,
    mentionNotificationsEnabled: false,
    protectWebRtcIp: true,
    proxyEnabled: false,
    proxyType: 'http',
    proxyHost: '',
    proxyPort: '',
    showNewTabButtonInHeader: true,
    showBackButtonInHeader: false,
    showForwardButtonInHeader: false,
    showReloadButtonInHeader: false,
    showScrollButtonInHeader: false,
    oneHandMode: false,
    oneTabPerSite: false,
    oneProfilePerSite: false,
    deckTabWidth: 400,
    sidebarCollapsed: false,
    desktopLayout: 'auto',
    defaultZoom: 100,
    siteZoom: {},
    disabledServicesArr: [],
    enabledSearchProviderIds: ['url', 'duckduckgo', 'google'],
    selectedSearchProviderId: 'url',
    customSearchProviders: [],
    profiles: [DEFAULT_PROFILE],
    setLanguage: (language) => {
        settings$.language.set(normalizeI18nLanguage(language));
    },
    setDefaultZoom: (zoom) => {
        settings$.defaultZoom.set(zoom);
    },
    setSiteZoom: (site, zoom) => {
        if (zoom === null) {
            settings$.siteZoom[site].delete();
        }
        else {
            settings$.siteZoom[site].set(zoom);
        }
    },
    toggleService: (service) => {
        const index = settings$.disabledServicesArr.indexOf(service);
        if (index === -1) {
            settings$.disabledServicesArr.push(service);
        }
        else {
            settings$.disabledServicesArr.splice(index, 1);
        }
    },
    toggleSearchProvider: (providerId) => {
        if (providerId === 'url') {
            return;
        }
        const ids = settings$.enabledSearchProviderIds.get();
        const index = ids.indexOf(providerId);
        if (index === -1) {
            settings$.enabledSearchProviderIds.push(providerId);
            return;
        }
        settings$.enabledSearchProviderIds.splice(index, 1);
        if (settings$.selectedSearchProviderId.get() === providerId) {
            settings$.selectedSearchProviderId.set('url');
        }
    },
    setSelectedSearchProvider: (providerId) => {
        const enabledIds = settings$.enabledSearchProviderIds.get();
        settings$.selectedSearchProviderId.set(enabledIds.includes(providerId) ? providerId : 'url');
    },
    addCustomSearchProvider: (name, templateUrl) => {
        const trimmedName = name.trim();
        const trimmedTemplateUrl = templateUrl.trim();
        if (!trimmedName || !isValidSearchTemplate(trimmedTemplateUrl)) {
            return null;
        }
        const id = genId();
        settings$.customSearchProviders.push({
            id,
            name: trimmedName,
            templateUrl: trimmedTemplateUrl,
            iconUrl: getFaviconUrl(trimmedTemplateUrl),
        });
        if (!settings$.enabledSearchProviderIds.get().includes(id)) {
            settings$.enabledSearchProviderIds.push(id);
        }
        return id;
    },
    updateCustomSearchProvider: (id, name, templateUrl) => {
        const providers = settings$.customSearchProviders.get();
        const index = providers.findIndex((provider) => provider.id === id);
        const trimmedName = name.trim();
        const trimmedTemplateUrl = templateUrl.trim();
        if (index === -1 || !trimmedName || !isValidSearchTemplate(trimmedTemplateUrl)) {
            return;
        }
        settings$.customSearchProviders[index].assign({
            name: trimmedName,
            templateUrl: trimmedTemplateUrl,
            iconUrl: getFaviconUrl(trimmedTemplateUrl),
        });
    },
    deleteCustomSearchProvider: (id) => {
        const providers = settings$.customSearchProviders.get();
        const index = providers.findIndex((provider) => provider.id === id);
        if (index === -1) {
            return;
        }
        settings$.customSearchProviders.splice(index, 1);
        const enabledIds = settings$.enabledSearchProviderIds.get();
        const enabledIndex = enabledIds.indexOf(id);
        if (enabledIndex !== -1) {
            settings$.enabledSearchProviderIds.splice(enabledIndex, 1);
        }
        if (settings$.selectedSearchProviderId.get() === id) {
            settings$.selectedSearchProviderId.set('url');
        }
    },
    addProfile: (name, color) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return;
        }
        settings$.profiles.push({ ...DEFAULT_ANTI_DETECT, id: genId(), name: trimmedName, color });
    },
    updateProfile: (id, name, color, options = {}) => {
        const profiles = settings$.profiles.get();
        const index = profiles.findIndex((p) => p?.id === id);
        const trimmedName = name.trim();
        if (!trimmedName) {
            return;
        }
        if (index !== -1) {
            const currentProfile = profiles[index] ?? DEFAULT_PROFILE;
            settings$.profiles[index].assign({
                ...DEFAULT_ANTI_DETECT,
                ...currentProfile,
                ...options,
                name: trimmedName,
                color,
            });
        }
    },
    deleteProfile: (id) => {
        const profiles = settings$.profiles.get();
        const index = profiles.findIndex((p) => p?.id === id);
        if (index !== -1 && profiles[index] && !profiles[index].isDefault) {
            settings$.profiles.splice(index, 1);
            void import('@/lib/profile-data')
                .then(({ deleteProfileData }) => deleteProfileData(id))
                .catch((error) => {
                console.warn('Failed to delete profile data', error);
            });
        }
    },
});
syncObservable(settings$, {
    persist: {
        name: 'settings',
        plugin: ObservablePersistMMKV,
        transform: {
            load: (data) => {
                return normalizeSettings(data);
            },
        },
    },
});
export const ZOOM_PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300];
export const resolveZoom = (host, siteZoom, defaultZoom) => (host ? siteZoom?.[host] : undefined) ?? defaultZoom ?? 100;
