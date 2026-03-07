import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGameStorageDir } from '@/lib/config';
import { allocateGameId, writeUploadedGame } from '@/lib/games/upload';
import { consumeInspection } from '@/lib/security/uploadCache';

const submitSchema = z.object({
  inspectionId: z.string().min(1),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(400)
});

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const inspection = consumeInspection(body.inspectionId);

    if (!inspection) {
      return NextResponse.json({ error: 'Upload session expired. Please upload the ZIP again.' }, { status: 410 });
    }

    const storageDir = getGameStorageDir();
    const gameId = await allocateGameId(storageDir, body.title);

    await writeUploadedGame({
      storageDir,
      id: gameId,
      title: body.title,
      description: body.description,
      inspection
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/game/${gameId}`);

    return NextResponse.json({
      ok: true,
      gameId,
      gameUrl: `/game/${gameId}`,
      flagged: inspection.allowlistViolation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid submission payload.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Failed to publish game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
