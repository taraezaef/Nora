import { InstagramService } from './instagram';
import { TwitterService } from './twitter';
const services = {
    'www.instagram.com': new InstagramService(),
    'x.com': new TwitterService(),
};
export function getService(url) {
    const { host } = new URL(url);
    const service = services[host];
    console.log('[nora][service] lookup', { host, found: !!service });
    return service;
}
