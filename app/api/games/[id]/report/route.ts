import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { getRequestIp } from '@/lib/security/ip';
import { sha256 } from '@/lib/security/hash';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gameId = params.id;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim() || 'Not specified';
  const reporterIpHash = sha256(getRequestIp());

  const supabase = createServiceClient();

  const { data: game } = await supabase
    .from('games')
    .select('id, report_count')
    .eq('id', gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const nextCount = (game.report_count ?? 0) + 1;

  await supabase.from('game_reports').insert({
    game_id: gameId,
    reason,
    reporter_ip_hash: reporterIpHash
  });

  await supabase
    .from('games')
    .update({
      report_count: nextCount,
      is_hidden: nextCount >= 2,
      hidden_reason: nextCount >= 2 ? 'Auto-hidden due to reports' : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', gameId);

  return NextResponse.json({ success: true, reportCount: nextCount, hidden: nextCount >= 2 });
}
