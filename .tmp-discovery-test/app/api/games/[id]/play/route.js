import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
const THROTTLE_MS = 5 * 60 * 1000;
export async function POST(_, { params }) {
    const gameId = params.id;
    const c = cookies();
    const cookieKey = `play_${gameId}`;
    const lastPlay = Number(c.get(cookieKey)?.value ?? '0');
    if (Date.now() - lastPlay < THROTTLE_MS) {
        return NextResponse.json({ counted: false, reason: 'Session throttle active.' });
    }
    const updated = await getGameRepository().incrementPlay(gameId);
    if (!updated) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const response = NextResponse.json({ counted: true });
    response.cookies.set(cookieKey, String(Date.now()), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: THROTTLE_MS / 1000,
        path: '/'
    });
    return response;
}
