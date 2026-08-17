export function updateRecentTabIds(recentTabIds, previousTabId, nextTabId) {
    if (!previousTabId || previousTabId === nextTabId) {
        return recentTabIds.filter((tabId) => tabId !== nextTabId);
    }
    const nextHistory = recentTabIds.filter((tabId) => tabId !== previousTabId && tabId !== nextTabId);
    return [previousTabId, ...nextHistory];
}
export function pruneRecentTabIds(recentTabIds, existingTabIds) {
    const existingTabIdSet = new Set(existingTabIds);
    return recentTabIds.filter((tabId) => existingTabIdSet.has(tabId));
}
export function resolveCloseTarget({ activeTabId, closingTabId, recentTabIds, availableTabIds, preferredTabIds, adjacentTabId, }) {
    if (!activeTabId || activeTabId !== closingTabId) {
        return activeTabId;
    }
    const availableTabIdSet = new Set(availableTabIds);
    const preferredTabIdSet = preferredTabIds ? new Set(preferredTabIds) : null;
    for (const tabId of recentTabIds) {
        if (tabId === closingTabId || !availableTabIdSet.has(tabId)) {
            continue;
        }
        if (preferredTabIdSet && !preferredTabIdSet.has(tabId)) {
            continue;
        }
        return tabId;
    }
    if (adjacentTabId && availableTabIdSet.has(adjacentTabId)) {
        return adjacentTabId;
    }
    if (preferredTabIdSet) {
        return preferredTabIds?.find((tabId) => availableTabIdSet.has(tabId));
    }
    return availableTabIds[0];
}
export function pruneChildBackParentByTabId(childBackParentByTabId, existingTabIds) {
    const existingTabIdSet = new Set(existingTabIds);
    return Object.fromEntries(Object.entries(childBackParentByTabId).filter(([childTabId, parentTabId]) => existingTabIdSet.has(childTabId) && existingTabIdSet.has(parentTabId)));
}
export function invalidateChildBackTargetOnUserSwitch(childBackParentByTabId, fromTabId, toTabId) {
    if (!fromTabId || fromTabId === toTabId || !(fromTabId in childBackParentByTabId)) {
        return childBackParentByTabId;
    }
    const { [fromTabId]: _removed, ...rest } = childBackParentByTabId;
    return rest;
}
export function consumeChildBackTarget(childBackParentByTabId, tabId) {
    if (!tabId || !(tabId in childBackParentByTabId)) {
        return childBackParentByTabId;
    }
    const { [tabId]: _removed, ...rest } = childBackParentByTabId;
    return rest;
}
export function getChildBackTarget(childBackParentByTabId, activeTabId, canGoBack, existingTabIds) {
    if (!activeTabId || canGoBack) {
        return undefined;
    }
    const targetTabId = childBackParentByTabId[activeTabId];
    if (!targetTabId) {
        return undefined;
    }
    const existingTabIdSet = new Set(existingTabIds);
    return existingTabIdSet.has(targetTabId) ? targetTabId : undefined;
}
/**
 * Deferred cold-start restore: decides which restored tabs should stay unloaded so the
 * active tab gets the network and renderer to itself. A blank or paused active tab never
 * loads anything, so there is nothing to prioritise and no tab is held back.
 */
export function shouldTabStartDormant(tabs, activeTabIndex, index) {
    const activeTab = tabs[activeTabIndex];
    if (!activeTab?.url || activeTab.isPaused) {
        return false;
    }
    const tab = tabs[index];
    return index !== activeTabIndex && Boolean(tab?.url) && !tab?.isPaused;
}
