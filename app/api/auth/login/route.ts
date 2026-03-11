import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signIn } from '@/lib/auth';

const authSchema = z.object({
  loginId: z.string(),
  password: z.string()
});

export async function POST(request: Request) {
  try {
    const body = authSchema.parse(await request.json());
    const session = await signIn(body.loginId, body.password);
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
    const message = error instanceof Error ? error.message : '로그인을 완료하지 못했어요.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
