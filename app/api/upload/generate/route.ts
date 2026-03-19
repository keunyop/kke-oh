import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import {
  createGameId,
  createSingleHtmlInspection,
  generateUniqueGameSlug,
  prepareInspectionForPublishing,
  writeUploadedGame,
  writeUploadedGameToSupabase
} from '@/lib/games/upload';
import { generateGameFromCreatePrompt } from '@/lib/games/ai-game-generator';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';

const bodySchema = z.object({
  prompt: z.string().trim().min(8).max(1200)
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const generated = await generateGameFromCreatePrompt({ gameDescription: body.prompt });
    const inspection = await prepareInspectionForPublishing(
      createSingleHtmlInspection(generated.html, generated.thumbnail),
      generated.title
    );

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const gameId = createGameId();
    const gameSlug = await generateUniqueGameSlug(storageDir, generated.title);

    if (driver === 'supabase') {
      await writeUploadedGameToSupabase({
        id: gameId,
        slug: gameSlug,
        title: generated.title,
        description: generated.description,
        leaderboardEnabled: true,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection,
        uploaderEmailHash: sha256(''),
        uploaderIpHash: sha256(getRequestIp())
      });
    } else {
      await writeUploadedGame({
        storageDir: storageDir as string,
        id: gameId,
        slug: gameSlug,
        title: generated.title,
        description: generated.description,
        leaderboardEnabled: true,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection
      });
    }

    revalidatePath('/');
    revalidatePath('/submit');
    revalidatePath('/my-games');
    revalidatePath(`/game/${gameSlug}`);

    return NextResponse.json({
      ok: true,
      gameId,
      gameUrl: `/game/${gameSlug}`,
      flagged: inspection.allowlistViolation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Prompt must be between 8 and 1200 characters.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Could not generate the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


