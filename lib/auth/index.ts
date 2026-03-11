import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from '@/lib/auth/password';
import { getAuthRepository, validateCredentials } from '@/lib/auth/repository';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getSessionExpiryDate } from '@/lib/auth/session';
import type { AuthUser } from '@/lib/auth/types';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await getAuthRepository().getUserBySessionToken(token);
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
  const repository = getAuthRepository();
  const user = await repository.createUser(loginId, password);
  return createUserSession(user);
}

export async function signIn(loginId: string, password: string) {
  validateCredentials(loginId, password);
  const repository = getAuthRepository();
  const user = await repository.findUserByLoginId(loginId);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('ID 또는 비밀번호를 다시 확인해주세요.');
  }

  return createUserSession(user);
}

async function createUserSession(user: AuthUser) {
  const repository = getAuthRepository();
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
  await getAuthRepository().deleteSession(token);
}

export { AUTH_COOKIE_NAME, getAuthCookieOptions };
