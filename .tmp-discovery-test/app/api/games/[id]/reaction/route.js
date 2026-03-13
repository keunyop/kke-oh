import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
const COOKIE_AGE_SECONDS = 60 * 60 * 24 * 365;
function isReaction(value) {
    return value === 'LIKE' || value === 'DISLIKE';
}
export async function POST(req, { params }) {
    const body = (await req.json().catch(() => ({})));
    if (!isReaction(body.reaction)) {
        return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }
    const cookieStore = cookies();
    const cookieKey = `reaction_${params.id}`;
    const previousValue = cookieStore.get(cookieKey)?.value ?? null;
    const previousReaction = isReaction(previousValue) ? previousValue : null;
    const result = await getGameRepository().applyReaction(params.id, body.reaction, previousReaction);
    if (!result) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const response = NextResponse.json({
        success: true,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        reaction: result.reaction
    });
    response.cookies.set(cookieKey, result.reaction, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_AGE_SECONDS,
        path: '/'
    });
    return response;
}
