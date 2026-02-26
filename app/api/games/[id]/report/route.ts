import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gameId = params.id;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim() || 'Not specified';

  const result = await getGameRepository().report(gameId, reason);
  if (!result) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, reportCount: result.reportCount, hidden: result.hidden });
}
