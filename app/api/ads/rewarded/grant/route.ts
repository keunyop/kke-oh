import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { grantRewardedAdPoints } from '@/lib/points/service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      eventId?: string;
      grantToken?: string;
    };

    const eventId = body.eventId?.trim();
    const grantToken = body.grantToken?.trim();

    if (!eventId || !grantToken) {
      return NextResponse.json({ error: 'Reward approval payload is incomplete.' }, { status: 400 });
    }

    const balance = await grantRewardedAdPoints(user.id, eventId, grantToken);
    return NextResponse.json({ ok: true, balance });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not grant rewarded ad points.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
