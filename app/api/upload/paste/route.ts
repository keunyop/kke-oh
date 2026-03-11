import path from 'node:path';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import {
  allocateGameId,
  createSingleHtmlInspection,
  createThumbnailUpload,
  writeUploadedGame,
  writeUploadedGameToSupabase
} from '@/lib/games/upload';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '濡쒓렇?명븳 ?ㅼ뿉 寃뚯엫???щ┫ ???덉뼱??' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const htmlFile = formData.get('htmlFile');
    const thumbnail = formData.get('thumbnail');
    let html = String(formData.get('html') ?? '').trim();

    if (title.length < 2 || title.length > 80) {
      return NextResponse.json({ error: '寃뚯엫 ?대쫫??2湲???댁긽 ?곸뼱二쇱꽭??' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: '寃뚯엫 ?ㅻ챸???곸뼱二쇱꽭??' }, { status: 400 });
    }

    if (htmlFile instanceof File) {
      const extension = path.extname(htmlFile.name).toLowerCase();
      if (extension && !['.html', '.htm'].includes(extension)) {
        return NextResponse.json({ error: 'Please upload an HTML file.' }, { status: 400 });
      }

      html = (await htmlFile.text()).trim();
    }

    if (!html) {
      return NextResponse.json({ error: 'HTML 肄붾뱶瑜??ｌ뼱二쇱꽭??' }, { status: 400 });
    }

    const inspection = createSingleHtmlInspection(
      html,
      await createThumbnailUpload(thumbnail instanceof File ? thumbnail : null)
    );

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const gameId = await allocateGameId(storageDir, title);

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
    revalidatePath(`/game/${gameId}`);

    return NextResponse.json({
      ok: true,
      gameId,
      gameUrl: `/game/${gameId}`,
      flagged: inspection.allowlistViolation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '寃뚯엫???щ━吏 紐삵뻽?댁슂.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
