import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { genId } from '@/lib/utils';
export const DECK_VIEW_ID = 'deck';
const savedViewSlotCounts = {
    'split-view': 2,
    'grid-4': 4,
};
const getSavedViewDefaultName = (layout, index) => '';
const getSanitizedLayout = (layout) => (layout === 'grid-4' ? 'grid-4' : 'split-view');
const getSlotCount = (layout) => savedViewSlotCounts[layout];
const getInitialSeedTabIds = (layout, seedTabIds) => seedTabIds.slice(0, layout === 'split-view' ? getSlotCount('split-view') : getSlotCount(layout));
const sanitizeSlotTabIds = (layout, slotTabIds) => {
    const minimumCount = getSlotCount(layout);
    if (layout === 'split-view') {
        return (slotTabIds || []).filter((tabId) => typeof tabId === 'string' && Boolean(tabId));
    }
    const sanitizedSource = (slotTabIds || []).slice(0, minimumCount);
    const sanitized = sanitizedSource.map((tabId) => (typeof tabId === 'string' && tabId ? tabId : null));
    while (sanitized.length < minimumCount) {
        sanitized.push(null);
    }
    return sanitized;
};
const normalizeSavedViews = (data) => {
    if (!data) {
        return data;
    }
    const layoutCounts = {
        'split-view': 0,
        'grid-4': 0,
    };
    data.savedViews = (data.savedViews || [])
        .filter((view) => view != null)
        .map((view) => {
        const layout = getSanitizedLayout(view.layout);
        layoutCounts[layout] += 1;
        return {
            id: typeof view.id === 'string' && view.id ? view.id : genId(),
            name: typeof view.name === 'string' && view.name.trim()
                ? view.name.trim()
                : getSavedViewDefaultName(layout, layoutCounts[layout]),
            layout,
            slotTabIds: sanitizeSlotTabIds(layout, view.slotTabIds),
        };
    });
    const hasActiveCustomView = typeof data.activeViewId === 'string' && data.savedViews.some((view) => view.id === data.activeViewId);
    if (data.activeViewId !== DECK_VIEW_ID && !hasActiveCustomView) {
        data.activeViewId = DECK_VIEW_ID;
    }
    return data;
};
const findSavedViewIndex = (viewId) => savedViews$.savedViews.get().findIndex((view) => view?.id === viewId);
export const getSavedViewSlotCount = (layout) => getSlotCount(layout);
export const createDesktopSavedView = (layout, seedTabIds = []) => {
    const nextIndex = savedViews$.savedViews.get().filter((view) => view?.layout === layout).length + 1;
    const view = {
        id: genId(),
        name: getSavedViewDefaultName(layout, nextIndex),
        layout,
        slotTabIds: sanitizeSlotTabIds(layout, getInitialSeedTabIds(layout, seedTabIds)),
    };
    savedViews$.savedViews.push(view);
    savedViews$.activeViewId.set(view.id);
    return view.id;
};
export const savedViews$ = observable({
    activeViewId: DECK_VIEW_ID,
    savedViews: [],
    createSavedView: (layout, seedTabIds = []) => createDesktopSavedView(layout, seedTabIds),
    renameView: (viewId, name) => {
        const nextName = name.trim();
        if (!nextName) {
            return;
        }
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        savedViews$.savedViews[index].name.set(nextName);
    },
    deleteView: (viewId) => {
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        savedViews$.savedViews.splice(index, 1);
        if (savedViews$.activeViewId.get() === viewId) {
            savedViews$.activeViewId.set(DECK_VIEW_ID);
        }
    },
    setActiveView: (viewId) => {
        if (viewId === DECK_VIEW_ID || findSavedViewIndex(viewId) !== -1) {
            savedViews$.activeViewId.set(viewId);
        }
    },
    assignSlotTab: (viewId, slotIndex, tabId) => {
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        const view$ = savedViews$.savedViews[index];
        const layout = view$.layout.get();
        const slotTabIds = view$.slotTabIds.get();
        const slotCount = slotTabIds.length;
        if (slotIndex < 0 || slotIndex >= slotCount) {
            return;
        }
        if (tabId) {
            if (slotTabIds.some((currentTabId, currentIndex) => currentIndex !== slotIndex && currentTabId === tabId)) {
                return;
            }
            view$.slotTabIds[slotIndex].set(tabId);
            return;
        }
        if (layout === 'split-view') {
            view$.slotTabIds.splice(slotIndex, 1);
            if (!view$.slotTabIds.get().length) {
                savedViews$.deleteView(viewId);
            }
            return;
        }
        view$.slotTabIds[slotIndex].set(null);
    },
    appendSplitViewSlot: (viewId) => {
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        const view$ = savedViews$.savedViews[index];
        if (view$.layout.get() !== 'split-view') {
            return;
        }
        view$.slotTabIds.push(null);
    },
    removeSplitViewSlot: (viewId, slotIndex) => {
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        const view$ = savedViews$.savedViews[index];
        if (view$.layout.get() !== 'split-view') {
            return;
        }
        const slotCount = view$.slotTabIds.get().length;
        if (slotIndex < 0 || slotIndex >= slotCount) {
            return;
        }
        view$.slotTabIds.splice(slotIndex, 1);
        if (!view$.slotTabIds.get().length) {
            savedViews$.deleteView(viewId);
        }
    },
    reorderSlots: (viewId, fromSlotIndex, toSlotIndex) => {
        const index = findSavedViewIndex(viewId);
        if (index === -1) {
            return;
        }
        const view$ = savedViews$.savedViews[index];
        const currentTabIds = view$.slotTabIds.get();
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
        view$.slotTabIds.set(nextTabIds);
    },
    cleanupClosedTabIds: (tabIds) => {
        if (!tabIds.length) {
            return;
        }
        const closedTabIdSet = new Set(tabIds);
        const viewIdsToDelete = [];
        for (const savedView$ of savedViews$.savedViews) {
            const layout = savedView$.layout.get();
            const slotTabIds = savedView$.slotTabIds.get();
            const hasClosedAssignedTab = slotTabIds.some((tabId) => tabId && closedTabIdSet.has(tabId));
            if (!hasClosedAssignedTab) {
                continue;
            }
            const nextSlotTabIds = layout === 'split-view'
                ? sanitizeSlotTabIds(layout, slotTabIds.filter((tabId) => typeof tabId === 'string' && !closedTabIdSet.has(tabId)))
                : slotTabIds.map((tabId) => (tabId && closedTabIdSet.has(tabId) ? null : tabId));
            const changed = nextSlotTabIds.length !== slotTabIds.length || nextSlotTabIds.some((tabId, index) => tabId !== slotTabIds[index]);
            if (changed) {
                savedView$.slotTabIds.set(nextSlotTabIds);
            }
            if (layout === 'split-view' && nextSlotTabIds.every((tabId) => !tabId)) {
                viewIdsToDelete.push(savedView$.id.get());
            }
        }
        for (const viewId of viewIdsToDelete) {
            savedViews$.deleteView(viewId);
        }
    },
});
syncObservable(savedViews$, {
    persist: {
        name: 'desktop-saved-views',
        plugin: ObservablePersistMMKV,
        transform: {
            load: (data) => normalizeSavedViews(data),
        },
    },
});
