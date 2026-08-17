import { observable } from '@legendapp/state';
export const desktopWorkspaceState$ = observable({
    focusedEmptySlotByGroup: {},
});
export const focusDesktopGroupSlot = (groupId, slotIndex) => {
    const current = desktopWorkspaceState$.focusedEmptySlotByGroup[groupId].get();
    if (current !== slotIndex) {
        desktopWorkspaceState$.focusedEmptySlotByGroup[groupId].set(slotIndex);
    }
};
