import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAiModelById, getAiPointCost } from '@/lib/ai/models';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import {
  createGameId,
  createSingleHtmlInspection,
  createThumbnailUpload,
  generateUniqueGameSlug,
  prepareInspectionForPublishing,
  resolveGameSlug,
  writeUploadedGame,
  writeUploadedGameToSupabase
} from '@/lib/games/upload';
import { generateGameFromCreatePrompt } from '@/lib/games/ai-game-generator';
import { getUserPointBalance } from '@/lib/points/service';
import { sha256 } from '@/lib/security/hash';

const BYPASS_AI_CREATE_POINT_CHECK_DURING_TEST = true;
import { getRequestIp } from '@/lib/security/ip';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '').trim();
    const slug = String(formData.get('slug') ?? '').trim();
    const prompt = String(formData.get('prompt') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const modelId = String(formData.get('modelId') ?? '').trim();
    const thumbnail = formData.get('thumbnail');

    if (title && (title.length < 2 || title.length > 80)) {
      return NextResponse.json({ error: 'Game name must be between 2 and 80 characters.' }, { status: 400 });
    }

    if (title && !slug) {
      return NextResponse.json({ error: 'URL game name is required when display game name is set.' }, { status: 400 });
    }

    if (slug && slug.length > 80) {
      return NextResponse.json({ error: 'URL game name must be 80 characters or fewer.' }, { status: 400 });
    }

    if (prompt.length < 8 || prompt.length > 1200) {
      return NextResponse.json({ error: 'Prompt must be between 8 and 1200 characters.' }, { status: 400 });
    }

    if (description.length > 400) {
      return NextResponse.json({ error: 'Description must be 400 characters or fewer.' }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: 'AI model selection is required.' }, { status: 400 });
    }

    const model = await getAiModelById(modelId);
    const pointCost = getAiPointCost(model, 'create');
    const balance = await getUserPointBalance(user.id);
    if (!BYPASS_AI_CREATE_POINT_CHECK_DURING_TEST && balance < pointCost) {
      return NextResponse.json({ error: 'Not enough points for the selected AI model.', requiredPoints: pointCost, balance }, { status: 400 });
    }

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const generated = await generateGameFromCreatePrompt({ gameDescription: prompt }, model.modelName);
    const uploadThumbnail = await createThumbnailUpload(thumbnail instanceof File ? thumbnail : null);
    const finalTitle = title || generated.title;
    const finalSlug = slug
      ? await resolveGameSlug(storageDir, slug)
      : await generateUniqueGameSlug(storageDir, generated.title);
    const finalDescription = description || generated.description;
    const inspection = await prepareInspectionForPublishing(
      createSingleHtmlInspection(generated.html, uploadThumbnail ?? generated.thumbnail, { injectScoreBridge: true }),
      finalTitle
    );
    const gameId = createGameId();

    if (driver === 'supabase') {
      await writeUploadedGameToSupabase({
        id: gameId,
        slug: finalSlug,
        title: finalTitle,
        description: finalDescription,
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
        slug: finalSlug,
        title: finalTitle,
        description: finalDescription,
        leaderboardEnabled: true,
        uploaderUserId: user.id,
        uploaderName: user.loginId,
        inspection
      });
    }

    revalidatePath('/');
    revalidatePath('/submit');
    revalidatePath('/my-games');
    revalidatePath(`/game/${finalSlug}`);

    return NextResponse.json({
      ok: true,
      gameId,
      gameUrl: `/game/${finalSlug}`,
      flagged: inspection.allowlistViolation,
      pointsSpent: BYPASS_AI_CREATE_POINT_CHECK_DURING_TEST ? 0 : pointCost
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not generate the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

