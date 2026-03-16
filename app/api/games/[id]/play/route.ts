import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { grantUserPoints, getPlayPointReward } from '@/lib/points/service';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';

const THROTTLE_MS = 5 * 60 * 1000;

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const gameId = params.id;
  const c = cookies();
  const cookieKey = `play_${gameId}`;
  const lastPlay = Number(c.get(cookieKey)?.value ?? '0');

  if (Date.now() - lastPlay < THROTTLE_MS) {
    return NextResponse.json({ counted: false, reason: 'Session throttle active.' });
  }

  const user = await getCurrentUser();
  const repository = getGameRepository();
  const game = await repository.getById(gameId);
  const ipHash = sha256(getRequestIp());
  const updated = await repository.incrementPlay(gameId, ipHash);
  if (!updated) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  let pointBalance: number | null = null;
  if (user && game && game.status === 'PUBLIC' && !game.is_hidden && game.uploader_user_id !== user.id) {
    try {
      const reward = await grantUserPoints({
        userId: user.id,
        delta: getPlayPointReward(),
        sourceType: 'play',
        sourceId: `${gameId}:${Math.floor(Date.now() / THROTTLE_MS)}`,
        metadata: {
          gameId,
          ipHash
        }
      });
      pointBalance = reward.balance;
    } catch {
      pointBalance = null;
    }
  }

  const response = NextResponse.json({ counted: true, pointBalance });
  response.cookies.set(cookieKey, String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THROTTLE_MS / 1000,
    path: '/'
  });
  return response;
}
