import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import {
  createSingleHtmlInspection,
  createThumbnailUpload,
  prepareInspectionForPublishing,
  resolveGameIdFromTitle,
  writeUploadedGame,
  writeUploadedGameToSupabase
} from '@/lib/games/upload';
import { generateGameFromPrompt } from '@/lib/openai/game-generator';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '').trim();
    const prompt = String(formData.get('prompt') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const thumbnail = formData.get('thumbnail');

    if (title && (title.length < 2 || title.length > 80)) {
      return NextResponse.json({ error: 'Game name must be between 2 and 80 characters.' }, { status: 400 });
    }

    if (prompt.length < 8 || prompt.length > 1200) {
      return NextResponse.json({ error: 'Prompt must be between 8 and 1200 characters.' }, { status: 400 });
    }

    if (description.length > 400) {
      return NextResponse.json({ error: 'Description must be 400 characters or fewer.' }, { status: 400 });
    }

    const generated = await generateGameFromPrompt(prompt);
    const uploadThumbnail = await createThumbnailUpload(thumbnail instanceof File ? thumbnail : null);
    const finalTitle = title || generated.title;
    const finalDescription = description || generated.description;
    const inspection = await prepareInspectionForPublishing(
      createSingleHtmlInspection(generated.html, uploadThumbnail ?? generated.thumbnail),
      finalTitle
    );

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const gameId = await resolveGameIdFromTitle(storageDir, finalTitle);

    if (driver === 'supabase') {
      await writeUploadedGameToSupabase({
        id: gameId,
        title: finalTitle,
        description: finalDescription,
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
        title: finalTitle,
        description: finalDescription,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection
      });
    }

    revalidatePath('/');
    revalidatePath('/submit');
    revalidatePath('/my-games');
    revalidatePath(`/game/${gameId}`);

    return NextResponse.json({
      ok: true,
      gameId,
      gameUrl: `/game/${gameId}`,
      flagged: inspection.allowlistViolation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not generate the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
