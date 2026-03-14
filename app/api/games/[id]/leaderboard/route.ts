import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitGameLeaderboardScore } from '@/lib/games/leaderboard';
import { getGameRepository } from '@/lib/games/repository';
import type { GameRecord } from '@/lib/games/types';

function canAccessGame(game: GameRecord, userId: string | null) {
  if (game.status === 'REMOVED') {
    return false;
  }

  if (game.status === 'PUBLIC' && !game.is_hidden) {
    return true;
  }

  return Boolean(userId && game.uploader_user_id === userId);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const repository = getGameRepository();
    const game = await repository.getById(params.id);
    const user = await getCurrentUser();

    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    if (!canAccessGame(game, user?.id ?? null)) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      playerName?: unknown;
      score?: unknown;
    };

    const entries = await submitGameLeaderboardScore(game, String(body.playerName ?? ''), Number(body.score));
    return NextResponse.json({ ok: true, entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save the score.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
