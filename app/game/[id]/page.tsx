import { GameActions, GameFullscreenButton } from '@/components/game/game-actions';
import { GameFullscreenShell } from '@/components/game/game-fullscreen-shell';
import { GameLeaderboard } from '@/components/game/game-leaderboard';
import { getCurrentUser } from '@/lib/auth';
import { listGameLeaderboard } from '@/lib/games/leaderboard';
import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: { id: string } }) {
  const locale = getRequestLocale();
  const t = getDictionary(locale);
  const creatorLabel = locale === 'ko' ? '만든 사람' : 'Creator';
  const draftNotice =
    locale === 'ko'
      ? '이 게임은 아직 초안이에요. 작성자인 당신만 이 미리보기를 볼 수 있어요.'
      : 'This game is still a draft. Only you can see this preview right now.';
  const hiddenNotice =
    locale === 'ko'
      ? '이 게임은 현재 공개 목록에 보이지 않아요. 작성자만 확인할 수 있어요.'
      : 'This game is currently hidden from the public catalog. Only the creator can preview it.';
  const previewActionsNotice =
    locale === 'ko'
      ? '초안 미리보기에서는 공개 반응 대신 게임 동작과 점수를 먼저 테스트할 수 있어요.'
      : 'In draft preview, you can test the gameplay and score flow before publishing.';

  const user = await getCurrentUser();
  const game = await getGameRepository().getBySlug(params.id.toLowerCase());
  const isOwner = Boolean(game && user && game.uploader_user_id === user.id);
  const canView = Boolean(game && game.status !== 'REMOVED' && ((game.status === 'PUBLIC' && !game.is_hidden) || isOwner));

  if (!game || !canView) {
    return (
      <section className="empty-state-card">
        <h1>{t.game.unavailableTitle}</h1>
        <p>{t.game.unavailableDescription}</p>
        <a href="/" className="button-primary">
          {t.common.home}
        </a>
      </section>
    );
  }

  const src = getGameAssetUrl(game.id, game.entry_path);
  const frameId = `game-frame-${game.id}`;
  const iframeId = `game-iframe-${game.id}`;
  const isDraftPreview = game.status !== 'PUBLIC' || game.is_hidden;
  const canUsePublicActions = game.status === 'PUBLIC' && !game.is_hidden;
  const leaderboardEntries = game.leaderboard_enabled ? await listGameLeaderboard(game.id) : [];

  return (
    <section className="game-page">
      <div id={frameId} className="game-frame-wrap">
        <GameFullscreenShell frameId={frameId} />
        <iframe
          id={iframeId}
          src={src}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          referrerPolicy="no-referrer"
          allow="fullscreen"
          allowFullScreen
          title={game.title}
          tabIndex={0}
        />
        <GameFullscreenButton frameId={frameId} iframeId={iframeId} locale={locale} />
      </div>

      {game.leaderboard_enabled || leaderboardEntries.length ? (
        <GameLeaderboard
          gameId={game.id}
          locale={locale}
          initialEntries={leaderboardEntries}
          allowSubmission={Boolean(game.leaderboard_enabled && (canUsePublicActions || isOwner))}
          isDraftPreview={isDraftPreview}
        />
      ) : null}

      <section className="panel-card game-description-card">
        <div className="game-description-head">
          <div className="game-description-copy">
            <h1>{game.title}</h1>
            <p className="small-copy">
              {creatorLabel} {game.uploader_name}
            </p>
            {isDraftPreview ? <p className="small-copy game-preview-note">{game.status === 'DRAFT' ? draftNotice : hiddenNotice}</p> : null}
          </div>
          {canUsePublicActions ? (
            <GameActions
              gameId={game.id}
              title={game.title}
              initialLikeCount={game.like_count}
              initialDislikeCount={game.dislike_count}
              locale={locale}
            />
          ) : (
            <p className="small-copy game-status-inline">{previewActionsNotice}</p>
          )}
        </div>
        <p>{game.description}</p>
      </section>

      {canUsePublicActions ? <script dangerouslySetInnerHTML={{ __html: `fetch('/api/games/${game.id}/play',{method:'POST'});` }} /> : null}
    </section>
  );
}
