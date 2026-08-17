import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
export const bookmarks$ = observable({
    bookmarks: [],
    addBookmark: (bookmark) => {
        bookmarks$.bookmarks.push(bookmark);
    },
    deleteBookmark: (index) => {
        bookmarks$.bookmarks.splice(index, 1);
    },
});
syncObservable(bookmarks$, {
    persist: {
        name: 'bookmarks',
        plugin: ObservablePersistMMKV,
    },
});
