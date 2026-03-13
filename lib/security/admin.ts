import { getCurrentUser } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth/types';
import { isAdminUser } from '@/lib/security/admin-rules';
export { isAdminLoginId, isAdminUser } from '@/lib/security/admin-rules';

export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return isAdminUser(user) ? user : null;
}

export async function isAdminAuthorized(): Promise<boolean> {
  return Boolean(await getAdminUser());
}
