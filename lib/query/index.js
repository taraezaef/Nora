import { auth$ } from '@/states/auth';
const HOST = 'https://a.inks.page';
const defaultEntitlement = {
    plan: 'free',
    source: 'none',
};
function getErrorMessage(payload, fallback) {
    return payload?.error?.json?.message || payload?.message || fallback || 'Request failed';
}
async function callNoraApi(path, init, authorization = auth$.accessToken.get()) {
    const headers = new Headers(init?.headers);
    if (authorization) {
        headers.set('authorization', authorization);
    }
    const method = init?.method?.toUpperCase();
    if ((init?.body || (method && method !== 'GET' && method !== 'HEAD')) && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }
    const res = await fetch(`${HOST}/api/${path}`, {
        ...init,
        headers,
    });
    const rawText = await res.text();
    const payload = (() => {
        try {
            return rawText ? JSON.parse(rawText) : null;
        }
        catch {
            return null;
        }
    })();
    if (!res.ok || payload?.error) {
        const fallback = rawText ? `HTTP ${res.status}: ${rawText.slice(0, 200)}` : `HTTP ${res.status}`;
        throw new Error(getErrorMessage(payload, fallback));
    }
    return payload?.result?.data;
}
export const getMeQuery = (options) => ({
    queryKey: ['me'],
    queryFn: async () => {
        const authorization = auth$.accessToken.get();
        if (!authorization) {
            return defaultEntitlement;
        }
        return callNoraApi('nora.me');
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
});
export const fetchWebAuthLink = (accessToken) => callNoraApi('users.link', undefined, accessToken);
export const prepareIosPurchase = () => callNoraApi('nora.prepareIosPurchase', { method: 'POST' });
export const syncIosTransaction = (signedTransactionInfo) => callNoraApi('nora.syncIosTransaction', {
    method: 'POST',
    body: JSON.stringify({ signedTransactionInfo }),
});
