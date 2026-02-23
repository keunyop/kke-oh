import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function GET() {
  if (!isAdminAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('games')
    .select('id, title, status, is_hidden, hidden_reason, report_count, created_at, uploader_email_hash, uploader_ip_hash')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ games: data });
}
