import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const updated = await getGameRepository().remove(params.id);
  if (!updated) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/game/${params.id}`);
  return NextResponse.json({ success: true });
}
