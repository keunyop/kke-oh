import crypto from 'node:crypto';
export const AUTH_COOKIE_NAME = 'kkeoh_session';
const SESSION_DAYS = 30;
export function createSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}
export function getSessionExpiryDate() {
    return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}
export function getAuthCookieOptions(expires) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires
    };
}
