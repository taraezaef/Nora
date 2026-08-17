import { fbL10nSponsored, isFacebookDesktopSponsoredPost, isFacebookMessagesPath, shouldHideFacebookOpenAppBanner, } from './services/facebook';
import { linkedinL10nPromoted } from './services/linkedin';
import { getService } from './services/manager';
const { host } = document.location;
const hideElement = (element) => {
    element.style.display = 'none';
};
const hideFacebookDesktopAds = (element) => {
    if (isFacebookMessagesPath(document.location.pathname)) {
        return;
    }
    if (typeof element.closest !== 'function') {
        return;
    }
    const container = element.closest('[role="article"], div[data-pagelet^="FeedUnit"]');
    if (!container || !(container instanceof HTMLElement) || container.dataset.noraHiddenAd === '1') {
        return;
    }
    if (isFacebookDesktopSponsoredPost(container)) {
        container.dataset.noraHiddenAd = '1';
        hideElement(container);
    }
};
export function blockAds() {
    if (!['www.instagram.com', 'www.reddit.com', 'x.com'].includes(host)) {
        return;
    }
    function interceptResponse(url, response) {
        try {
            const service = getService(document.location.href);
            console.log('[nora][xhr] intercept candidate', {
                pageHost: host,
                requestUrl: url,
                hasService: !!service,
            });
            if (service?.shouldIntercept(url)) {
                console.log('[nora][xhr] transforming response', { requestUrl: url });
                response = service.transformResponse(response);
            }
            else {
                console.log('[nora][xhr] skipped response', { requestUrl: url });
            }
        }
        catch (e) {
            console.error(e);
        }
        return response;
    }
    // https://stackoverflow.com/a/77243932
    const XHR = window.XMLHttpRequest;
    class XMLHttpRequest extends XHR {
        get responseText() {
            if (this.readyState == 4) {
                return interceptResponse(this.responseURL, super.responseText);
            }
            return super.responseText;
        }
        get response() {
            if (this.readyState == 4) {
                return interceptResponse(this.responseURL, super.response);
            }
            return super.response;
        }
    }
    window.XMLHttpRequest = XMLHttpRequest;
}
export function hideAds(mutations) {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes.values()) {
            const el = node;
            switch (host) {
                case 'm.facebook.com': {
                    if (el.dataset?.trackingDurationId) {
                        const text = el.querySelector('.native-text.rslh .f5')?.textContent;
                        for (const text of fbL10nSponsored) {
                            if (el.textContent?.includes(text)) {
                                // facebook server rendered ads
                                hideElement(el);
                                break;
                            }
                        }
                    }
                    break;
                }
                case 'www.facebook.com': {
                    hideFacebookDesktopAds(el);
                    break;
                }
            }
        }
        switch (host) {
            case 'm.facebook.com': {
                const target = document.querySelector('.fixed-container.bottom');
                if (shouldHideFacebookOpenAppBanner(target)) {
                    // facebook open app btn
                    target.dataset.noraHiddenOpenApp = '1';
                    hideElement(target);
                }
                break;
            }
            case 'www.facebook.com': {
                if (!isFacebookMessagesPath(document.location.pathname)) {
                    const items = document.querySelectorAll('[role="article"], div[data-pagelet^="FeedUnit"], div[role="feed"] > div');
                    for (const item of items) {
                        hideFacebookDesktopAds(item);
                    }
                }
                break;
            }
            case 'www.linkedin.com': {
                const items = document.querySelectorAll('.feed-item');
                for (const item of items) {
                    const label = item.querySelector('span.text-color-text-low-emphasis')?.innerText;
                    if (linkedinL10nPromoted.includes(label)) {
                        ;
                        item.style.display = 'none';
                    }
                }
                break;
            }
        }
    }
}
