import { getAuthStorageDir, getGameDataDriver } from '@/lib/config';
import { FilesystemAuthRepository } from '@/lib/auth/providers/filesystem';
import { SupabaseAuthRepository } from '@/lib/auth/providers/supabase';
import type { AuthUser } from '@/lib/auth/types';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';

export interface AuthRepository {
  findUserByLoginId(loginId: string): Promise<AuthUser | null>;
  createUser(loginId: string, password: string): Promise<AuthUser>;
  createSession(userId: string, expiresAt: Date): Promise<string>;
  getUserBySessionToken(token: string): Promise<AuthUser | null>;
  deleteSession(token: string): Promise<void>;
}

let repository: AuthRepository | null = null;

function initialize() {
  if (repository) return;

  const driver = getGameDataDriver();
  if (driver === 'supabase') {
    repository = new SupabaseAuthRepository();
    return;
  }

  if (driver !== 'filesystem') {
    throw new Error(`Unsupported GAME_DATA_DRIVER: ${driver}`);
  }

  repository = new FilesystemAuthRepository(getAuthStorageDir());
}

export function getAuthRepository(): AuthRepository {
  initialize();
  return repository as AuthRepository;
}

export function validateCredentials(loginId: string, password: string) {
  const safeLoginId = sanitizeLoginId(loginId);
  if (safeLoginId.length < 2 || safeLoginId.length > 24) {
    throw new Error('ID는 2글자 이상 24글자 이하로 적어주세요.');
  }

  if (password.length < 2 || password.length > 80) {
    throw new Error('비밀번호는 2글자 이상 80글자 이하로 적어주세요.');
  }

  return {
    loginId: safeLoginId,
    normalizedLoginId: normalizeLoginId(safeLoginId)
  };
}
