export function decideDocumentSync({ dirty, hasRemote, remoteUpdatedAt, lastSyncedRemoteUpdatedAt, pushWhenRemoteMissing, hasMeaningfulLocalValue, }) {
    if (!hasRemote) {
        if (pushWhenRemoteMissing || dirty || hasMeaningfulLocalValue) {
            return { action: 'push', backupLocal: false };
        }
        return { action: 'noop', backupLocal: false };
    }
    if (!dirty) {
        if (remoteUpdatedAt !== lastSyncedRemoteUpdatedAt) {
            return { action: 'pull', backupLocal: false };
        }
        return { action: 'noop', backupLocal: false };
    }
    if (!lastSyncedRemoteUpdatedAt || remoteUpdatedAt !== lastSyncedRemoteUpdatedAt) {
        return { action: 'pull', backupLocal: true };
    }
    return { action: 'push', backupLocal: false };
}
