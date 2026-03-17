import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signUp } from '@/lib/auth';
import { translateAuthError } from '@/lib/auth/errors';
import { getRequestLocale } from '@/lib/i18n/server';

const authSchema = z.object({
  loginId: z.string(),
  password: z.string()
});

export async function POST(request: Request) {
  const locale = getRequestLocale();

  try {
    const body = authSchema.parse(await request.json());
    const session = await signUp(body.loginId, body.password);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: session.user.id,
        loginId: session.user.loginId
      }
    });

    response.cookies.set(AUTH_COOKIE_NAME, session.token, getAuthCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    const message = translateAuthError(error, locale, 'signup_failed');
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

