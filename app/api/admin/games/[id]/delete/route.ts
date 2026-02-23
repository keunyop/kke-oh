import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  await supabase
    .from('games')
    .update({ status: 'REMOVED', is_hidden: true, hidden_reason: 'Removed by admin', updated_at: new Date().toISOString() })
    .eq('id', params.id);
  return NextResponse.json({ success: true });
}
