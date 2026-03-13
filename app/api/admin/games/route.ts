import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const games = await getGameRepository().listForAdmin(100);
  return NextResponse.json({ games });
}
