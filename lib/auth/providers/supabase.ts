import crypto from 'node:crypto';
import { AuthError } from '@/lib/auth/errors';
import { hashPassword } from '@/lib/auth/password';
import type { AuthRepository } from '@/lib/auth/repository';
import type { AuthUser } from '@/lib/auth/types';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';
import { createServiceClient } from '@/lib/db/supabase';
import { sha256 } from '@/lib/security/hash';

type UserRow = {
  id: string;
  login_id: string;
  normalized_login_id: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
};

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    loginId: row.login_id,
    normalizedLoginId: row.normalized_login_id,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  async findUserByLoginId(loginId: string): Promise<AuthUser | null> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('app_users')
      .select('id,login_id,normalized_login_id,password_hash,password_salt,created_at')
      .eq('normalized_login_id', normalizeLoginId(loginId))
      .maybeSingle();

    if (error) {
      throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
    }

    return data ? mapUser(data as UserRow) : null;
  }

  async createUser(loginId: string, password: string): Promise<AuthUser> {
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
        throw new AuthError('duplicate_login_id');
      }
      throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
    }

    return mapUser(data as UserRow);
  }

  async createSession(userId: string, expiresAt: Date): Promise<string> {
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

  async getUserBySessionToken(token: string): Promise<AuthUser | null> {
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
    return Array.isArray(user) ? null : mapUser(user as UserRow);
  }

  async deleteSession(token: string): Promise<void> {
    const supabase = createServiceClient();
    await supabase.from('app_sessions').delete().eq('session_token_hash', sha256(token));
  }
}

