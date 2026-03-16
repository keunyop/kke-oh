import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isGoogleRewardedAdsEnabled } from '@/lib/ads/config';
import { createRewardedAdEvent } from '@/lib/points/service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { gameId?: string };
    const gameId = body.gameId?.trim();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required.' }, { status: 400 });
    }

    if (!isGoogleRewardedAdsEnabled()) {
      return NextResponse.json({ supported: false, error: 'Rewarded ads are not configured.' }, { status: 400 });
    }

    const session = await createRewardedAdEvent(user.id, gameId);
    return NextResponse.json({
      supported: true,
      ...session
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not prepare the rewarded ad.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
