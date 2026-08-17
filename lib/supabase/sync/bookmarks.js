import { syncState, when } from '@legendapp/state';
import { bookmarks$ } from '@/states/bookmarks';
import { syncMeta$ } from '@/states/sync-meta';
import { BaseSyncer } from './base';
class BookmarksSyncer extends BaseSyncer {
    NAME = 'bookmarks';
    TABLE_NAME = 'bookmarks';
    pushWhenRemoteMissing = false;
    isPersistLoaded = () => when(syncState(bookmarks$).isPersistLoaded);
    getValue() {
        return bookmarks$.get();
    }
    setValue(value) {
        bookmarks$.assign(value);
    }
    hasMeaningfulLocalValue(value) {
        return value.bookmarks.length > 0;
    }
    getMeta() {
        return syncMeta$.bookmarks.get();
    }
    setMeta(meta) {
        syncMeta$.bookmarks.assign(meta);
    }
}
export const bookmarksSyncer = new BookmarksSyncer();
