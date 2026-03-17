import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';

const bodySchema = z.object({
  action: z.enum(['publish', 'hide', 'unhide', 'delete'])
});

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const repository = getGameRepository();
    const game = await repository.getById(context.params.id);

    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    if (game.uploader_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only manage your own games.' }, { status: 403 });
    }

    let ok = false;
    if (body.action === 'publish') {
      ok = await repository.publish(game.id);
    } else if (body.action === 'hide') {
      ok = await repository.hide(game.id, 'Hidden by owner');
    } else if (body.action === 'unhide') {
      ok = await repository.unhide(game.id);
    } else {
      ok = await repository.remove(game.id, 'Removed by owner');
    }

    if (!ok) {
      return NextResponse.json({ error: 'Action could not be completed.' }, { status: 400 });
    }

    const updatedGame = await repository.getById(game.id);

    revalidatePath('/');
    revalidatePath('/my-games');
    revalidatePath(`/game/${game.slug}`);

    return NextResponse.json({ ok: true, game: updatedGame });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Could not manage the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
