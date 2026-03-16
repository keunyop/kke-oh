import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import path from 'node:path';
import { getCurrentUser } from '@/lib/auth';
import { getAiModelById, getAiPointCost } from '@/lib/ai/models';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { getGameAssetStore, getGameRepository } from '@/lib/games/repository';
import type { GameRecord } from '@/lib/games/types';
import {
  createSingleHtmlInspection,
  createThumbnailUpload,
  inspectZipUpload,
  prepareInspectionForPublishing,
  withLeaderboardBridge,
  updateUploadedGame,
  updateUploadedGameInSupabase
} from '@/lib/games/upload';
import { generateGameFromPrompt } from '@/lib/games/ai-game-generator';
import { getUserPointBalance, grantUserPoints, spendUserPoints } from '@/lib/points/service';

type EditMode = 'html' | 'zip' | 'ai';

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

async function loadCurrentEntryHtml(game: GameRecord): Promise<string | null> {
  if (!game.entry_path) {
    return null;
  }

  const asset = await getGameAssetStore().readAsset(game.id, game.entry_path);
  if (!asset) {
    return null;
  }

  const looksLikeHtml = asset.contentType.includes('html') || /\.html?$/i.test(game.entry_path);
  if (!looksLikeHtml) {
    return null;
  }

  return asset.content.toString('utf8').slice(0, 12000);
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const repository = getGameRepository();
    const game = await repository.getById(context.params.id);

    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    if (game.uploader_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own games.' }, { status: 403 });
    }

    const formData = await request.formData();
    const mode = getText(formData, 'mode') as EditMode;
    const title = getText(formData, 'title');
    const description = getText(formData, 'description');
    const prompt = getText(formData, 'prompt');
    const modelId = getText(formData, 'modelId');
    const leaderboardEnabled = getText(formData, 'leaderboardEnabled') === 'true';
    const htmlFile = formData.get('htmlFile');
    const zipFile = formData.get('zipFile');
    const thumbnailFile = formData.get('thumbnail');

    if (!['html', 'zip', 'ai'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid edit mode.' }, { status: 400 });
    }

    if (title.length < 2 || title.length > 80) {
      return NextResponse.json({ error: 'Game name must be between 2 and 80 characters.' }, { status: 400 });
    }

    if (description.length > 400) {
      return NextResponse.json({ error: 'Description must be 400 characters or fewer.' }, { status: 400 });
    }

    const thumbnail = await createThumbnailUpload(thumbnailFile instanceof File ? thumbnailFile : null);
    let inspection = null;
    let nextDescription = description || game.description;
    let pointSpendSourceId: string | null = null;
    let pointCost = 0;
    let pointSpent = false;

    if (mode === 'html') {
      if (htmlFile instanceof File) {
        const extension = path.extname(htmlFile.name).toLowerCase();
        if (extension && !['.html', '.htm'].includes(extension)) {
          return NextResponse.json({ error: 'Please upload an HTML file.' }, { status: 400 });
        }

        const html = (await htmlFile.text()).trim();
        if (!html) {
          return NextResponse.json({ error: 'HTML content is required.' }, { status: 400 });
        }

        inspection = await prepareInspectionForPublishing(
          createSingleHtmlInspection(html, thumbnail, { injectScoreBridge: leaderboardEnabled }),
          title
        );
      }
    }

    if (mode === 'zip') {
      if (zipFile instanceof File) {
        const zipInspection = await inspectZipUpload(zipFile);
        const mergedInspection = thumbnail
          ? {
              ...zipInspection,
              files: [...zipInspection.files, thumbnail],
              thumbnailCandidates: [thumbnail.path, ...zipInspection.thumbnailCandidates.filter((item) => item !== thumbnail.path)]
            }
          : zipInspection;

        inspection = await prepareInspectionForPublishing(
          leaderboardEnabled ? withLeaderboardBridge(mergedInspection) : mergedInspection,
          title
        );
      }
    }

    if (mode === 'ai') {
      if (prompt.length < 8 || prompt.length > 1200) {
        return NextResponse.json({ error: 'Please write at least 8 characters for the AI update.' }, { status: 400 });
      }

      if (!modelId) {
        return NextResponse.json({ error: 'AI model selection is required.' }, { status: 400 });
      }

      const model = await getAiModelById(modelId);
      pointCost = getAiPointCost(model, 'edit');
      const balance = await getUserPointBalance(user.id);
      if (balance < pointCost) {
        return NextResponse.json({ error: 'Not enough points for the selected AI model.', requiredPoints: pointCost, balance }, { status: 400 });
      }

      const currentHtml = await loadCurrentEntryHtml(game);
      const aiPrompt = [
        `Current game title: ${game.title}`,
        `Current game description: ${game.description}`,
        currentHtml ? `Current game HTML:\n${currentHtml}` : null,
        `Update request: ${prompt}`
      ]
        .filter(Boolean)
        .join('\n\n');

      const generated = await generateGameFromPrompt(aiPrompt, model.modelName);
      nextDescription = description || generated.description || game.description;
      inspection = await prepareInspectionForPublishing(
        createSingleHtmlInspection(generated.html, thumbnail ?? generated.thumbnail, { injectScoreBridge: leaderboardEnabled }),
        title
      );
      pointSpendSourceId = `ai-edit:${game.id}:${Date.now()}`;
    }

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;

    try {
      if (mode === 'ai' && pointSpendSourceId) {
        await spendUserPoints({
          userId: user.id,
          delta: pointCost,
          sourceType: 'ai_edit',
          sourceId: pointSpendSourceId,
          metadata: {
            modelId,
            gameId: game.id
          }
        });
        pointSpent = true;
      }

      if (driver === 'supabase') {
        await updateUploadedGameInSupabase({
          game,
          title,
          description: nextDescription,
          inspection,
          leaderboardEnabled,
          thumbnail
        });
      } else {
        await updateUploadedGame({
          storageDir: storageDir as string,
          game,
          title,
          description: nextDescription,
          inspection,
          leaderboardEnabled,
          thumbnail
        });
      }
    } catch (error) {
      if (pointSpent && pointSpendSourceId) {
        await grantUserPoints({
          userId: user.id,
          delta: pointCost,
          type: 'refund',
          sourceType: 'ai_edit_refund',
          sourceId: pointSpendSourceId,
          metadata: {
            modelId,
            gameId: game.id
          }
        }).catch(() => {});
      }

      throw error;
    }

    const updatedGame = await repository.getById(game.id);

    revalidatePath('/');
    revalidatePath('/my-games');
    revalidatePath(`/my-games/${game.id}/edit`);
    revalidatePath(`/game/${game.slug}`);

    return NextResponse.json({
      ok: true,
      game: updatedGame,
      gameUrl: `/game/${updatedGame?.slug ?? game.slug}`,
      pointsSpent: pointCost
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update the game.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
