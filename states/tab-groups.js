import { batch, observable } from '@legendapp/state';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { syncObservable } from '@legendapp/state/sync';
import { addTabToGroup, createTabGroupId, getDefaultGroupName, normalizeTabGroups, removeTabFromGroups, sanitizeGroupTabIds, } from '@/lib/tab-groups';
const findGroupIndex = (groupId) => tabGroups$.groups.get().findIndex((group) => group?.id === groupId);
export const createDesktopTabGroupFromTab = (tabId, name) => {
    const groupId = createTabGroupId();
    const group = {
        id: groupId,
        name: name?.trim() || getDefaultGroupName(tabGroups$.groups.get().length + 1),
        layout: 'deck',
        tabIds: [tabId],
    };
    tabGroups$.groups.set(removeTabFromGroups(tabGroups$.groups.get(), tabId));
    tabGroups$.groups.push(group);
    tabGroups$.activeGroupId.set(groupId);
    return groupId;
};
export const createDesktopTabGroup = (layout, name) => {
    const groupId = createTabGroupId();
    const group = {
        id: groupId,
        name: name?.trim() || getDefaultGroupName(tabGroups$.groups.get().length + 1),
        layout,
        tabIds: sanitizeGroupTabIds(layout, []),
    };
    tabGroups$.groups.push(group);
    tabGroups$.activeGroupId.set(groupId);
    return groupId;
};
export const tabGroups$ = observable({
    activeGroupId: null,
    groups: [],
    createGroupFromTab: (tabId, name) => createDesktopTabGroupFromTab(tabId, name),
    createGroup: (layout, name) => createDesktopTabGroup(layout, name),
    renameGroup: (groupId, name) => {
        const nextName = name.trim();
        if (!nextName) {
            return;
        }
        const index = findGroupIndex(groupId);
        if (index !== -1) {
            tabGroups$.groups[index].name.set(nextName);
        }
    },
    deleteGroup: (groupId) => {
        const index = findGroupIndex(groupId);
        if (index === -1) {
            return;
        }
        tabGroups$.groups.splice(index, 1);
        if (tabGroups$.activeGroupId.get() === groupId) {
            tabGroups$.activeGroupId.set(null);
        }
    },
    setActiveGroup: (groupId) => {
        if (groupId == null || findGroupIndex(groupId) !== -1) {
            tabGroups$.activeGroupId.set(groupId);
        }
    },
    setGroupLayout: (groupId, layout) => {
        const index = findGroupIndex(groupId);
        if (index === -1) {
            return;
        }
        const group$ = tabGroups$.groups[index];
        group$.layout.set(layout);
        group$.tabIds.set(sanitizeGroupTabIds(layout, group$.tabIds.get()));
    },
    assignGroupSlot: (groupId, slotIndex, tabId) => {
        const index = findGroupIndex(groupId);
        if (index === -1) {
            return;
        }
        const group = tabGroups$.groups[index].get();
        if (slotIndex < 0 || slotIndex >= group.tabIds.length) {
            return;
        }
        if (tabId) {
            const groupsWithoutTab = removeTabFromGroups(tabGroups$.groups.get(), tabId);
            const nextGroups = groupsWithoutTab.map((currentGroup) => currentGroup.id === groupId
                ? {
                    ...currentGroup,
                    tabIds: currentGroup.tabIds.map((currentTabId, currentIndex) => currentIndex === slotIndex ? tabId : currentTabId),
                }
                : currentGroup);
            tabGroups$.groups.set(nextGroups);
            return;
        }
        if (group.layout === 'grid-4') {
            tabGroups$.groups[index].tabIds[slotIndex].set(null);
            return;
        }
        tabGroups$.groups[index].tabIds.splice(slotIndex, 1);
    },
    moveTabToGroup: (tabId, groupId, targetIndex) => {
        const currentGroups = tabGroups$.groups.get();
        const targetGroup = groupId ? currentGroups.find((group) => group.id === groupId) : null;
        if (targetGroup) {
            const nextTargetGroup = addTabToGroup(targetGroup, tabId, targetIndex);
            if (nextTargetGroup === targetGroup && !targetGroup.tabIds.includes(tabId)) {
                return;
            }
        }
        let nextGroups = removeTabFromGroups(currentGroups, tabId);
        if (groupId) {
            nextGroups = nextGroups.map((group) => (group.id === groupId ? addTabToGroup(group, tabId, targetIndex) : group));
        }
        batch(() => {
            tabGroups$.groups.set(nextGroups);
            tabGroups$.activeGroupId.set(groupId);
        });
    },
    appendSplitGroupSlot: (groupId) => {
        const index = findGroupIndex(groupId);
        if (index !== -1 && tabGroups$.groups[index].layout.get() === 'split-view') {
            const currentTabIds = tabGroups$.groups[index].tabIds.get();
            tabGroups$.groups[index].tabIds.set([...currentTabIds, null]);
        }
    },
    removeSplitGroupSlot: (groupId, slotIndex) => {
        const index = findGroupIndex(groupId);
        if (index === -1 || tabGroups$.groups[index].layout.get() !== 'split-view') {
            return;
        }
        const slotCount = tabGroups$.groups[index].tabIds.get().length;
        if (slotIndex >= 0 && slotIndex < slotCount) {
            tabGroups$.groups[index].tabIds.splice(slotIndex, 1);
        }
    },
    reorderGroupSlots: (groupId, fromSlotIndex, toSlotIndex) => {
        const index = findGroupIndex(groupId);
        if (index === -1) {
            return;
        }
        const currentTabIds = tabGroups$.groups[index].tabIds.get();
        const slotCount = currentTabIds.length;
        if (fromSlotIndex < 0 ||
            fromSlotIndex >= slotCount ||
            toSlotIndex < 0 ||
            toSlotIndex >= slotCount ||
            fromSlotIndex === toSlotIndex) {
            return;
        }
        const nextTabIds = [...currentTabIds];
        const [moved] = nextTabIds.splice(fromSlotIndex, 1);
        nextTabIds.splice(toSlotIndex, 0, moved);
        tabGroups$.groups[index].tabIds.set(nextTabIds);
    },
    cleanupClosedTabIds: (tabIds) => {
        if (!tabIds.length) {
            return;
        }
        const closedTabIds = new Set(tabIds);
        tabGroups$.groups.set(tabGroups$.groups.get().map((group) => ({
            ...group,
            tabIds: group.layout === 'grid-4'
                ? group.tabIds.map((tabId) => (tabId && closedTabIds.has(tabId) ? null : tabId))
                : group.tabIds.filter((tabId) => !tabId || !closedTabIds.has(tabId)),
        })));
    },
});
syncObservable(tabGroups$, {
    persist: {
        name: 'desktop-tab-groups',
        plugin: ObservablePersistMMKV,
        transform: {
            load: (data) => normalizeTabGroups(data),
        },
    },
});
