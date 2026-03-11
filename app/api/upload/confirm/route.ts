import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { allocateGameId, writeUploadedGame, writeUploadedGameToSupabase } from '@/lib/games/upload';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';
import { consumeInspection } from '@/lib/security/uploadCache';

const submitSchema = z.object({
  inspectionId: z.string().min(1),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(1).max(400)
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인한 뒤에 게임을 올릴 수 있어요.' }, { status: 401 });
    }

    const body = submitSchema.parse(await request.json());
    const inspection = consumeInspection(body.inspectionId);

    if (!inspection) {
      return NextResponse.json({ error: 'Upload session expired. Please upload the ZIP again.' }, { status: 410 });
    }

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const gameId = await allocateGameId(storageDir, body.title);

    if (driver === 'supabase') {
      const uploaderIpHash = sha256(getRequestIp());
      const uploaderEmailHash = sha256('');

      await writeUploadedGameToSupabase({
        id: gameId,
        title: body.title,
        description: body.description,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection,
        uploaderEmailHash,
        uploaderIpHash
      });
    } else {
      await writeUploadedGame({
        storageDir: storageDir as string,
        id: gameId,
        title: body.title,
        description: body.description,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection
      });
    }

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
