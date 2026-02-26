import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const secret = String(form.get('secret') ?? '');
  const adminSecret = process.env.ADMIN_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET is not configured.' }, { status: 500 });
  }

  if (secret !== adminSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL('/admin', req.url));
  response.cookies.set('admin_secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  return response;
}
