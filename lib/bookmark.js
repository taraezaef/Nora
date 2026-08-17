import * as cheerio from 'cheerio/slim';
import { t } from 'i18next';
import { showToast } from './toast';
import { bookmarks$ } from '@/states/bookmarks';
export async function getMeta(url) {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $('title').text();
    const icon = $('link[rel*=icon]').attr('href') || 'favicon.ico';
    return { title, icon: new URL(icon, url).href };
}
export const addBookmark = (tab) => {
    if (tab?.url) {
        bookmarks$.addBookmark({
            url: tab.url,
            title: tab.title || tab.url,
            icon: tab.icon || '',
        });
        showToast(t('toast.pinned'));
    }
};
