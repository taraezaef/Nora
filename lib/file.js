function getMimeType(filename) {
    const name = filename.toLowerCase();
    if (name.endsWith('.csv')) {
        return 'text/csv';
    }
    return name.endsWith('.json') ? 'application/json' : 'text/plain';
}
export async function saveFile(filename, content) {
    const blob = new Blob([content], { type: `${getMimeType(filename)};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a tick to start the download before dropping the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
