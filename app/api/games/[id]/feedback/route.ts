import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { message?: string };
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
