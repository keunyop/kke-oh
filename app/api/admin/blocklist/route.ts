import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function POST() {
  if (!(await isAdminAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(
    { error: 'Blocklist is disabled in filesystem MVP mode.' },
    { status: 410 }
  );
}
