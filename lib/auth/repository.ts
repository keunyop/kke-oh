import { AuthError } from '@/lib/auth/errors';
import { FilesystemAuthRepository } from '@/lib/auth/providers/filesystem';
import { SupabaseAuthRepository } from '@/lib/auth/providers/supabase';
import type { AuthUser } from '@/lib/auth/types';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';
import { getAuthStorageDir, getGameDataDriver } from '@/lib/config';

export interface AuthRepository {
  findUserByLoginId(loginId: string): Promise<AuthUser | null>;
  createUser(loginId: string, password: string): Promise<AuthUser>;
  createSession(userId: string, expiresAt: Date): Promise<string>;
  getUserBySessionToken(token: string): Promise<AuthUser | null>;
  deleteSession(token: string): Promise<void>;
}

let repository: AuthRepository | null = null;
let filesystemRepository: AuthRepository | null = null;

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

export function getFilesystemAuthRepository(): AuthRepository {
  if (!filesystemRepository) {
    filesystemRepository = new FilesystemAuthRepository(getAuthStorageDir());
  }
  return filesystemRepository;
}

export function validateCredentials(loginId: string, password: string) {
  const safeLoginId = sanitizeLoginId(loginId);
  if (safeLoginId.length < 2 || safeLoginId.length > 24) {
    throw new AuthError('login_id_length');
  }

  if (password.length < 2 || password.length > 80) {
    throw new AuthError('password_length');
  }

  return {
    loginId: safeLoginId,
    normalizedLoginId: normalizeLoginId(safeLoginId)
  };
}

