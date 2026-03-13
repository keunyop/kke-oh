import crypto from 'node:crypto';
import { hashPassword } from '@/lib/auth/password';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';
import { createServiceClient } from '@/lib/db/supabase';
import { sha256 } from '@/lib/security/hash';
function mapUser(row) {
    return {
        id: row.id,
        loginId: row.login_id,
        normalizedLoginId: row.normalized_login_id,
        passwordHash: row.password_hash,
        passwordSalt: row.password_salt,
        createdAt: row.created_at
    };
}
export class SupabaseAuthRepository {
    async findUserByLoginId(loginId) {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('app_users')
            .select('id,login_id,normalized_login_id,password_hash,password_salt,created_at')
            .eq('normalized_login_id', normalizeLoginId(loginId))
            .maybeSingle();
        if (error) {
            throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
        }
        return data ? mapUser(data) : null;
    }
    async createUser(loginId, password) {
        const supabase = createServiceClient();
        const normalizedLoginId = normalizeLoginId(loginId);
        const safeLoginId = sanitizeLoginId(loginId);
        const { hash, salt } = hashPassword(password);
        const { data, error } = await supabase
            .from('app_users')
            .insert({
            id: crypto.randomUUID(),
            login_id: safeLoginId,
            normalized_login_id: normalizedLoginId,
            password_hash: hash,
            password_salt: salt,
            created_at: new Date().toISOString()
        })
            .select('id,login_id,normalized_login_id,password_hash,password_salt,created_at')
            .single();
        if (error) {
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                throw new Error('이미 사용 중인 ID예요.');
            }
            throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
        }
        return mapUser(data);
    }
    async createSession(userId, expiresAt) {
        const token = crypto.randomBytes(32).toString('hex');
        const supabase = createServiceClient();
        const { error } = await supabase.from('app_sessions').insert({
            id: crypto.randomUUID(),
            user_id: userId,
            session_token_hash: sha256(token),
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString()
        });
        if (error) {
            throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
        }
        return token;
    }
    async getUserBySessionToken(token) {
        const supabase = createServiceClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('app_sessions')
            .select('expires_at, app_users!inner(id,login_id,normalized_login_id,password_hash,password_salt,created_at)')
            .eq('session_token_hash', sha256(token))
            .gt('expires_at', now)
            .maybeSingle();
        if (error) {
            throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
        }
        if (!data || !('app_users' in data)) {
            return null;
        }
        const user = data.app_users;
        return Array.isArray(user) ? null : mapUser(user);
    }
    async deleteSession(token) {
        const supabase = createServiceClient();
        await supabase.from('app_sessions').delete().eq('session_token_hash', sha256(token));
    }
}
