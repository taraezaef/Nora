const URL_RE = /(https?:\/\/[^\s]+)/i;
export function parseSharedUrl(payload) {
    const direct = payload?.webUrl?.trim();
    if (direct && isValidUrl(direct)) {
        return direct;
    }
    const text = payload?.text?.trim();
    if (!text) {
        return null;
    }
    if (isValidUrl(text)) {
        return text;
    }
    const match = text.match(URL_RE)?.[1];
    return match && isValidUrl(match) ? match : null;
}
function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
