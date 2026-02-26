import { cookies, headers } from 'next/headers';

export function isAdminAuthorized(): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const hSecret = headers().get('x-admin-secret');
  const cSecret = cookies().get('admin_secret')?.value;
  return hSecret === secret || cSecret === secret;
}
