import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { getRequestIp } from '@/lib/security/ip';
import { sha256 } from '@/lib/security/hash';

const THROTTLE_MS = 5 * 60 * 1000;

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const gameId = params.id;
  const ipHash = sha256(getRequestIp());
  const c = cookies();
  const cookieKey = `play_${gameId}`;
  const lastPlay = Number(c.get(cookieKey)?.value ?? '0');

  if (Date.now() - lastPlay < THROTTLE_MS) {
    return NextResponse.json({ counted: false, reason: 'Session throttle active.' });
  }

  const supabase = createServiceClient();

  const { data: game } = await supabase.from('games').select('id').eq('id', gameId).single();
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  await supabase.rpc('increment_play_counters', { p_game_id: gameId, p_ip_hash: ipHash });

  const response = NextResponse.json({ counted: true });
  response.cookies.set(cookieKey, String(Date.now()), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: THROTTLE_MS / 1000,
    path: '/'
  });
  return response;
}
