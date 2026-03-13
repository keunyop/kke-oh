import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, signOutCurrentUser } from '@/lib/auth';
export async function POST(request) {
    await signOutCurrentUser();
    const response = NextResponse.redirect(new URL('/', request.url), { status: 303 });
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
    return response;
}
