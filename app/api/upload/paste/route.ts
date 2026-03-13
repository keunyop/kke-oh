import path from 'node:path';
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
    const description = String(formData.get('description') ?? '').trim();
    const htmlFile = formData.get('htmlFile');
    const thumbnail = formData.get('thumbnail');
    let html = String(formData.get('html') ?? '').trim();

    if (title.length < 2 || title.length > 80) {
      return NextResponse.json({ error: 'Title must be between 2 and 80 characters.' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    if (htmlFile instanceof File) {
      const extension = path.extname(htmlFile.name).toLowerCase();
      if (extension && !['.html', '.htm'].includes(extension)) {
        return NextResponse.json({ error: 'Please upload an HTML file.' }, { status: 400 });
      }

      html = (await htmlFile.text()).trim();
    }

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required.' }, { status: 400 });
    }

    const inspection = await prepareInspectionForPublishing(
      createSingleHtmlInspection(
        html,
        await createThumbnailUpload(thumbnail instanceof File ? thumbnail : null)
      ),
      title
    );

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const gameId = await resolveGameIdFromTitle(storageDir, title);

    if (driver === 'supabase') {
      await writeUploadedGameToSupabase({
        id: gameId,
        title,
        description,
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
        title,
        description,
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
    const message = error instanceof Error ? error.message : 'Could not create the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
