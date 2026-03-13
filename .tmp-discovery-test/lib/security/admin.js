import { getCurrentUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/security/admin-rules';
export { isAdminLoginId, isAdminUser } from '@/lib/security/admin-rules';
export async function getAdminUser() {
    const user = await getCurrentUser();
    return isAdminUser(user) ? user : null;
}
export async function isAdminAuthorized() {
    return Boolean(await getAdminUser());
}
