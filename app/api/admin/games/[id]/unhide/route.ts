import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getGameRepository } from '@/lib/games/repository';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const repository = getGameRepository();
  const game = await repository.getById(params.id);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  const updated = await repository.unhide(game.id);
  if (!updated) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/game/${game.slug}`);
  return NextResponse.json({ success: true });
}