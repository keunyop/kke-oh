import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config';

export async function POST(req: Request) {
  const form = await req.formData();
  const secret = String(form.get('secret') ?? '');
  if (secret !== getEnv('ADMIN_SECRET')) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  const response = NextResponse.redirect(new URL('/admin', req.url));
  response.cookies.set('admin_secret', secret, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return response;
}
