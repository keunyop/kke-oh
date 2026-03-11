import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from '@/lib/auth/password';
import { getAuthRepository, getFilesystemAuthRepository, type AuthRepository, validateCredentials } from '@/lib/auth/repository';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getSessionExpiryDate } from '@/lib/auth/session';
import type { AuthUser } from '@/lib/auth/types';

function shouldFallbackToFilesystem(error: unknown) {
  return error instanceof Error && error.message.includes('Supabase auth tables are missing');
}

async function readUserFromToken(token: string) {
  try {
    return await getAuthRepository().getUserBySessionToken(token);
  } catch (error) {
    if (!shouldFallbackToFilesystem(error)) {
      throw error;
    }
    return getFilesystemAuthRepository().getUserBySessionToken(token);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await readUserFromToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(nextPath = '/submit') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function signUp(loginId: string, password: string) {
  validateCredentials(loginId, password);

  try {
    const repository = getAuthRepository();
    const user = await repository.createUser(loginId, password);
    return createUserSession(user, repository);
  } catch (error) {
    if (!shouldFallbackToFilesystem(error)) {
      throw error;
    }

    const repository = getFilesystemAuthRepository();
    const user = await repository.createUser(loginId, password);
    return createUserSession(user, repository);
  }
}

export async function signIn(loginId: string, password: string) {
  validateCredentials(loginId, password);

  let repository: AuthRepository = getAuthRepository();
  let user: AuthUser | null = null;

  try {
    user = await repository.findUserByLoginId(loginId);
  } catch (error) {
    if (!shouldFallbackToFilesystem(error)) {
      throw error;
    }
    repository = getFilesystemAuthRepository();
    user = await repository.findUserByLoginId(loginId);
  }

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('ID 또는 비밀번호를 다시 확인해주세요.');
  }

  return createUserSession(user, repository);
}

async function createUserSession(user: AuthUser, repository: AuthRepository) {
  const expiresAt = getSessionExpiryDate();
  const token = await repository.createSession(user.id, expiresAt);

  return {
    user,
    token,
    expiresAt
  };
}

export async function signOutCurrentUser() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return;

  try {
    await getAuthRepository().deleteSession(token);
  } catch (error) {
    if (!shouldFallbackToFilesystem(error)) {
      throw error;
    }
    await getFilesystemAuthRepository().deleteSession(token);
  }
}

export { AUTH_COOKIE_NAME, getAuthCookieOptions };
