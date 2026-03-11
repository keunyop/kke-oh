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
      return NextResponse.json({ error: '로그인한 뒤에 게임을 올릴 수 있어요.' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const html = String(formData.get('html') ?? '').trim();
    const thumbnail = formData.get('thumbnail');

    if (title.length < 2 || title.length > 80) {
      return NextResponse.json({ error: '게임 이름을 2글자 이상 적어주세요.' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: '게임 설명을 적어주세요.' }, { status: 400 });
    }

    if (!html) {
      return NextResponse.json({ error: 'HTML 코드를 넣어주세요.' }, { status: 400 });
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
    const message = error instanceof Error ? error.message : '게임을 올리지 못했어요.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
