import { CDN_ALLOWLIST } from '@/lib/config';
const URL_REGEX = /https?:\/\/([a-zA-Z0-9.-]+)(?:[/:?#]|$)/g;
export function detectAllowlistViolation(contents) {
    for (const content of contents) {
        const matches = content.matchAll(URL_REGEX);
        for (const match of matches) {
            const host = match[1]?.toLowerCase();
            if (host && !CDN_ALLOWLIST.has(host)) {
                return true;
            }
        }
    }
    return false;
}
export function getGamePageCsp() {
    const hosts = Array.from(CDN_ALLOWLIST).map((h) => `https://${h}`);
    return [
        "default-src 'self'",
        "frame-src 'self'",
        `script-src 'self' 'unsafe-inline' ${hosts.join(' ')}`,
        `connect-src 'self' ${hosts.join(' ')}`,
        `img-src 'self' data: blob: ${hosts.join(' ')}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com"
    ].join('; ');
}
