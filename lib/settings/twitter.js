export const xHomeTimelineValues = ['for-you', 'following'];
export const normalizeXHomeTimeline = (value) => {
    return value === 'following' ? 'following' : 'for-you';
};
export const resolveXHomeTabsDecision = (settings, state) => {
    const desiredTimeline = normalizeXHomeTimeline(settings.xDefaultHomeTimeline);
    if (state.shouldRespectDefaultTimeline && state.activeTimeline !== desiredTimeline) {
        return {
            revealTabs: state.tabsHidden,
            switchTo: desiredTimeline,
            hideTabs: false,
        };
    }
    return {
        revealTabs: false,
        switchTo: null,
        hideTabs: state.shouldHideTabs,
    };
};
