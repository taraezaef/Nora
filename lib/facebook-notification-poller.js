const categories = ['friends', 'messages', 'groups', 'notifications'];
export const emptyFacebookNotificationCounts = () => ({
    friends: 0,
    messages: 0,
    groups: 0,
    notifications: 0,
});
const categoryUrls = {
    friends: 'https://m.facebook.com/friends/center/requests/',
    messages: 'https://m.facebook.com/messages/',
    groups: 'https://m.facebook.com/groups/',
    notifications: 'https://m.facebook.com/notifications.php',
};
const categoryTitles = {
    friends: 'Facebook friend requests',
    messages: 'Facebook messages',
    groups: 'Facebook group updates',
    notifications: 'Facebook notifications',
};
const categoryLabels = {
    friends: 'friend requests',
    messages: 'messages',
    groups: 'group updates',
    notifications: 'notifications',
};
const decodeHtml = (value) => value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
const stripTags = (value) => decodeHtml(value.replace(/<[^>]*>/g, ' '));
const getAttr = (attrs, name) => {
    const match = attrs.match(new RegExp(`${name}\\s*=\\s*(['"])(.*?)\\1`, 'i'));
    return match?.[2] ? decodeHtml(match[2]) : '';
};
const parseCount = (value) => {
    const match = value.replace(/,/g, '').match(/\b(\d+)\+?\b/);
    return match ? Number(match[1]) : 0;
};
const categoryFromHref = (href) => {
    const normalized = href.toLowerCase();
    if (normalized.includes('/friends/center/requests') || normalized.includes('/friends/requests'))
        return 'friends';
    if (normalized.includes('/messages'))
        return 'messages';
    if (normalized.includes('/groups'))
        return 'groups';
    if (normalized.includes('/notifications.php') || normalized.includes('/notifications/'))
        return 'notifications';
};
export const parseFacebookNotificationCounts = (html) => {
    const counts = emptyFacebookNotificationCounts();
    const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    for (const match of html.matchAll(anchorPattern)) {
        const attrs = match[1] || '';
        const href = getAttr(attrs, 'href');
        const category = categoryFromHref(href);
        if (!category)
            continue;
        const text = [getAttr(attrs, 'aria-label'), getAttr(attrs, 'title'), stripTags(match[2] || '')].join(' ');
        counts[category] = Math.max(counts[category], parseCount(text));
    }
    return counts;
};
export const buildFacebookNotificationItemInput = (profileId, counts, previousCounts = {}) => {
    const items = [];
    for (const category of categories) {
        const count = counts[category] || 0;
        const previous = previousCounts[category] || 0;
        if (count > previous) {
            items.push({ profileId, category, count });
        }
    }
    return items;
};
export const facebookNotificationItemDetails = ({ profileId, category, count }) => ({
    id: `${profileId}:${category}:${count}`,
    url: categoryUrls[category],
    title: categoryTitles[category],
    body: `You have ${count} new ${categoryLabels[category]}.`,
});
