/**
 * WebRTC gathers candidates outside the normal page networking stack, so a page
 * can learn the device's real LAN and public address even when traffic is
 * proxied or the system is on a VPN. Chromium can enforce this natively, so the
 * desktop app doesn't need the injected guard the mobile webviews use.
 */
let enabled = true;
const attached = new Set();
const apply = (wc) => {
    if (wc.isDestroyed()) {
        return;
    }
    wc.setWebRTCIPHandlingPolicy(enabled ? 'disable_non_proxied_udp' : 'default');
};
export function setWebRtcProtection(next) {
    enabled = next !== false;
    for (const wc of attached) {
        apply(wc);
    }
}
export function attachWebRtcProtection(wc) {
    attached.add(wc);
    wc.once('destroyed', () => attached.delete(wc));
    apply(wc);
}
