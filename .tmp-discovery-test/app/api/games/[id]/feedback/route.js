import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
export async function POST(req, { params }) {
    const body = (await req.json().catch(() => ({})));
    const message = body.message?.trim() ?? '';
    if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const success = await getGameRepository().addFeedback(params.id, message);
    if (!success) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}
