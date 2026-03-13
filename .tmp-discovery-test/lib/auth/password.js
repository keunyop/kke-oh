import crypto from 'node:crypto';
const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return { hash, salt };
}
export function verifyPassword(password, salt, expectedHash) {
    const actualHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    const expected = Buffer.from(expectedHash, 'hex');
    return expected.length === actualHash.length && crypto.timingSafeEqual(actualHash, expected);
}
