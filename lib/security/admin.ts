import { cookies, headers } from 'next/headers';
import { getEnv } from '@/lib/config';

export function isAdminAuthorized(): boolean {
  const secret = getEnv('ADMIN_SECRET');
  const hSecret = headers().get('x-admin-secret');
  const cSecret = cookies().get('admin_secret')?.value;
  return hSecret === secret || cSecret === secret;
}
