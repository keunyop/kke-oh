import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { hashPassword } from '@/lib/auth/password';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';
import { sha256 } from '@/lib/security/hash';
const AUTH_FILE_NAME = 'store.json';
async function readStore(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
        };
    }
    catch {
        return { users: [], sessions: [] };
    }
}
async function writeStore(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
function pruneExpiredSessions(data) {
    const now = Date.now();
    return {
        ...data,
        sessions: data.sessions.filter((session) => Date.parse(session.expiresAt) > now)
    };
}
export class FilesystemAuthRepository {
    storageDir;
    constructor(storageDir) {
        this.storageDir = storageDir;
    }
    getStorePath() {
        return path.join(this.storageDir, AUTH_FILE_NAME);
    }
    async findUserByLoginId(loginId) {
        const normalized = normalizeLoginId(loginId);
        const data = pruneExpiredSessions(await readStore(this.getStorePath()));
        return data.users.find((user) => user.normalizedLoginId === normalized) ?? null;
    }
    async createUser(loginId, password) {
        const filePath = this.getStorePath();
        const data = pruneExpiredSessions(await readStore(filePath));
        const normalizedLoginId = normalizeLoginId(loginId);
        const safeLoginId = sanitizeLoginId(loginId);
        if (data.users.some((user) => user.normalizedLoginId === normalizedLoginId)) {
            throw new Error('이미 사용 중인 ID예요.');
        }
        const { hash, salt } = hashPassword(password);
        const user = {
            id: crypto.randomUUID(),
            loginId: safeLoginId,
            normalizedLoginId,
            passwordHash: hash,
            passwordSalt: salt,
            createdAt: new Date().toISOString()
        };
        data.users.push(user);
        await writeStore(filePath, data);
        return user;
    }
    async createSession(userId, expiresAt) {
        const token = crypto.randomBytes(32).toString('hex');
        const filePath = this.getStorePath();
        const data = pruneExpiredSessions(await readStore(filePath));
        data.sessions.push({
            tokenHash: sha256(token),
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        });
        await writeStore(filePath, data);
        return token;
    }
    async getUserBySessionToken(token) {
        const filePath = this.getStorePath();
        const data = pruneExpiredSessions(await readStore(filePath));
        const tokenHash = sha256(token);
        const session = data.sessions.find((entry) => entry.tokenHash === tokenHash);
        await writeStore(filePath, data);
        if (!session)
            return null;
        return data.users.find((user) => user.id === session.userId) ?? null;
    }
    async deleteSession(token) {
        const filePath = this.getStorePath();
        const data = pruneExpiredSessions(await readStore(filePath));
        const tokenHash = sha256(token);
        const nextSessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);
        if (nextSessions.length === data.sessions.length) {
            return;
        }
        await writeStore(filePath, {
            ...data,
            sessions: nextSessions
        });
    }
}
