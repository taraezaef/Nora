import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { genId } from '@/lib/utils';
import { todayKey, isLimitableUrl } from '@/lib/usage-limits';
const MAX_DAYS = 14;
const pruneRecord = (record, keepDays) => {
    const keys = Object.keys(record).sort();
    if (keys.length <= keepDays)
        return record;
    const drop = keys.slice(0, keys.length - keepDays);
    const next = { ...record };
    for (const k of drop)
        delete next[k];
    return next;
};
export const usageLimits$ = observable({
    pin: null,
    limits: [],
    usage: {},
    bypassed: {},
    setPin: (pin) => {
        usageLimits$.pin.set(pin && pin.length ? pin : null);
    },
    addLimit: (name, scope, dailyMinutes) => {
        const id = genId();
        const trimmed = name.trim() || 'Limit';
        const minutes = Math.max(1, Math.floor(dailyMinutes));
        usageLimits$.limits.push({ id, name: trimmed, scope, dailyMinutes: minutes });
        return id;
    },
    updateLimit: (id, patch) => {
        const limits = usageLimits$.limits.get();
        const index = limits.findIndex((l) => l?.id === id);
        if (index === -1)
            return;
        const next = {};
        if (patch.name !== undefined) {
            const trimmed = patch.name.trim();
            if (trimmed)
                next.name = trimmed;
        }
        if (patch.scope !== undefined)
            next.scope = patch.scope;
        if (patch.dailyMinutes !== undefined)
            next.dailyMinutes = Math.max(1, Math.floor(patch.dailyMinutes));
        usageLimits$.limits[index].assign(next);
    },
    deleteLimit: (id) => {
        const limits = usageLimits$.limits.get();
        const index = limits.findIndex((l) => l?.id === id);
        if (index !== -1) {
            usageLimits$.limits.splice(index, 1);
        }
        // Drop usage rows for this limit across all days
        const usage = usageLimits$.usage.get();
        for (const day of Object.keys(usage)) {
            if (usage[day] && id in usage[day]) {
                const next = { ...usage[day] };
                delete next[id];
                usageLimits$.usage[day].set(next);
            }
        }
        const bypassed = usageLimits$.bypassed.get();
        for (const day of Object.keys(bypassed)) {
            const list = bypassed[day] || [];
            if (list.includes(id)) {
                usageLimits$.bypassed[day].set(list.filter((x) => x !== id));
            }
        }
    },
    incrementUsage: (limitId, minutes) => {
        if (minutes <= 0)
            return;
        const day = todayKey();
        const current = usageLimits$.usage[day].get() || {};
        const next = { ...current, [limitId]: (current[limitId] || 0) + minutes };
        usageLimits$.usage[day].set(next);
    },
    bypassToday: (limitId) => {
        const day = todayKey();
        const current = usageLimits$.bypassed[day].get() || [];
        if (!current.includes(limitId)) {
            usageLimits$.bypassed[day].set([...current, limitId]);
        }
    },
    pruneOldUsage: () => {
        const usage = usageLimits$.usage.get();
        const pruned = pruneRecord(usage, MAX_DAYS);
        if (pruned !== usage)
            usageLimits$.usage.set(pruned);
        const bypassed = usageLimits$.bypassed.get();
        const prunedB = pruneRecord(bypassed, MAX_DAYS);
        if (prunedB !== bypassed)
            usageLimits$.bypassed.set(prunedB);
    },
});
syncObservable(usageLimits$, {
    persist: {
        name: 'usage-limits',
        plugin: ObservablePersistMMKV,
    },
});
// Bypass is session-scoped: clear any stale bypasses persisted from a previous session.
usageLimits$.bypassed.set({});
export const limitMatchesService = (limit, service, url) => {
    if (limit.scope.kind === 'all')
        return isLimitableUrl(url);
    if (!service)
        return false;
    return limit.scope.services.includes(service);
};
export const getLimitUsageToday = (limitId) => {
    const day = todayKey();
    const usage = usageLimits$.usage[day].get() || {};
    return usage[limitId] || 0;
};
export const isLimitBypassedToday = (limitId) => {
    const day = todayKey();
    const list = usageLimits$.bypassed[day].get() || [];
    return list.includes(limitId);
};
