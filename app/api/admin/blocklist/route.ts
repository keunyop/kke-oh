import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function POST(req: Request) {
  if (!isAdminAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { type?: 'EMAIL' | 'IP'; valueHashOrValue?: string; reason?: string };
  if (!body.type || !body.valueHashOrValue) {
    return NextResponse.json({ error: 'type and valueHashOrValue required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  await supabase.from('blocklist').insert({
    type: body.type,
    value_hash_or_value: body.valueHashOrValue,
    reason: body.reason ?? 'Added by admin'
  });

  return NextResponse.json({ success: true });
}
