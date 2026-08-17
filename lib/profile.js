import { settings$ } from '@/states/settings';
import { getSiteFromProfileId } from './site-profile';
import { getDeterministicProfileColor } from './profile-color';
export const getProfileColor = (profileId) => {
    const site = getSiteFromProfileId(profileId);
    if (site) {
        return getDeterministicProfileColor(site);
    }
    const profiles = settings$.profiles.get();
    const sanitized = (profiles || []).filter((p) => p != null);
    if (!sanitized.length) {
        return undefined;
    }
    const defaultProfile = sanitized.find((p) => p.id === 'default') || sanitized[0];
    const activeProfile = sanitized.find((p) => p.id === (profileId || defaultProfile.id));
    return activeProfile?.color || defaultProfile.color;
};
