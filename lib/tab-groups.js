export const getDefaultGroupName = (index) => `Group ${index}`;
export const createTabGroupId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
export const getSanitizedTabGroupLayout = (layout) => {
    if (layout === 'split-view' || layout === 'grid-4' || layout === 'deck') {
        return layout;
    }
    return 'deck';
};
export const sanitizeGroupTabIds = (layout, tabIds) => {
    const uniqueTabIds = [];
    const seen = new Set();
    for (const tabId of tabIds || []) {
        if (typeof tabId !== 'string' || !tabId || seen.has(tabId)) {
            continue;
        }
        seen.add(tabId);
        uniqueTabIds.push(tabId);
    }
    if (layout === 'grid-4') {
        const next = uniqueTabIds.slice(0, 4);
        while (next.length < 4) {
            next.push(null);
        }
        return next;
    }
    return uniqueTabIds;
};
export const removeTabFromGroups = (groups, tabId) => groups.map((group) => ({
    ...group,
    tabIds: group.layout === 'grid-4'
        ? group.tabIds.map((currentTabId) => (currentTabId === tabId ? null : currentTabId))
        : group.tabIds.filter((currentTabId) => currentTabId !== tabId),
}));
export const addTabToGroup = (group, tabId, targetIndex) => {
    const tabIds = group.tabIds.filter((currentTabId) => typeof currentTabId === 'string');
    const withoutTab = tabIds.filter((currentTabId) => currentTabId !== tabId);
    const boundedIndex = typeof targetIndex === 'number' ? Math.max(0, Math.min(targetIndex, withoutTab.length)) : withoutTab.length;
    const nextTabIds = [...withoutTab.slice(0, boundedIndex), tabId, ...withoutTab.slice(boundedIndex)];
    if (group.layout === 'grid-4') {
        if (withoutTab.length >= 4) {
            return group;
        }
        return { ...group, tabIds: sanitizeGroupTabIds(group.layout, nextTabIds) };
    }
    return { ...group, tabIds: sanitizeGroupTabIds(group.layout, nextTabIds) };
};
export const normalizeTabGroups = (data) => {
    if (!data) {
        return data;
    }
    const seenGroupIds = new Set();
    const usedTabIds = new Set();
    data.groups = (data.groups || [])
        .filter((group) => group != null)
        .map((group, index) => {
        const id = typeof group.id === 'string' && group.id && !seenGroupIds.has(group.id) ? group.id : createTabGroupId();
        seenGroupIds.add(id);
        const layout = getSanitizedTabGroupLayout(group.layout);
        const tabIds = sanitizeGroupTabIds(layout, group.tabIds).map((tabId) => {
            if (!tabId || usedTabIds.has(tabId)) {
                return null;
            }
            usedTabIds.add(tabId);
            return tabId;
        });
        return {
            id,
            name: typeof group.name === 'string' && group.name.trim() ? group.name.trim() : getDefaultGroupName(index + 1),
            layout,
            tabIds: sanitizeGroupTabIds(layout, tabIds),
        };
    });
    if (typeof data.activeGroupId !== 'string' || !data.groups.some((group) => group.id === data.activeGroupId)) {
        data.activeGroupId = null;
    }
    return data;
};
