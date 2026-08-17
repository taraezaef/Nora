import { autoProfiles$ } from '@/states/auto-profiles';
import { deleteProfileData } from './profile-data';
export const deleteAutoProfileData = (profileId) => {
    autoProfiles$.removeProfile(profileId);
    deleteProfileData(profileId);
};
export const deleteAutoProfilesData = (profileIds) => {
    profileIds.forEach((profileId) => {
        deleteAutoProfileData(profileId);
    });
};
