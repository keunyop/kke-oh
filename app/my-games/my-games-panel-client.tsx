'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getPrimaryOwnerAction, getPrimaryOwnerActionClassName, type OwnerAction, shouldRenderPrimaryOwnerActionFirst } from '@/lib/games/owner-actions';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import { getGameAssetUrl } from '@/lib/games/urls';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type Props = {
  initialGames: GameRecord[];
  locale: Locale;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  game?: GameRecord | null;
};

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        empty: '아직 만든 게임이 없어요.',
        create: '게임 만들기',
        open: '열기',
        preview: '미리보기',
        edit: '수정',
        publish: '게시하기',
        hide: '게시 숨기기',
        unhide: '다시 공개',
        delete: '삭제',
        deleting: '처리 중...',
        public: '게시됨',
        draft: '초안',
        hidden: '숨김',
        removed: '삭제됨',
        createdAt: '만든 날짜',
        likes: '좋아요',
        dislikes: '싫어요',
        plays: '플레이',
        deleteTitle: '게임 삭제',
        deleteMessage: '이 게임을 삭제할까요? 삭제 후에는 다시 복구할 수 없어요.',
        cancel: '취소'
      }
    : {
        empty: 'You have not created any games yet.',
        create: 'Create Game',
        open: 'Open',
        preview: 'Preview',
        edit: 'Edit',
        publish: 'Publish',
        hide: 'Hide from Publish',
        unhide: 'Show again',
        delete: 'Delete',
        deleting: 'Working...',
        public: 'Published',
        draft: 'Draft',
        hidden: 'Hidden',
        removed: 'Removed',
        createdAt: 'Created',
        likes: 'Likes',
        dislikes: 'Dislikes',
        plays: 'Plays',
        deleteTitle: 'Delete game',
        deleteMessage: 'Delete this game? You cannot restore it later.',
        cancel: 'Cancel'
      };
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function getStatusLabel(game: GameRecord, copy: ReturnType<typeof getCopy>) {
  if (game.status === 'REMOVED') return copy.removed;
  if (game.is_hidden) return copy.hidden;
  if (game.status === 'DRAFT') return copy.draft;
  return copy.public;
}

function getPrimaryActionLabel(game: GameRecord, copy: ReturnType<typeof getCopy>) {
  const action = getPrimaryOwnerAction(game);
  if (action === 'publish') return copy.publish;
  if (action === 'unhide') return copy.unhide;
  return copy.hide;
}

export default function MyGamesPanelClient({ initialGames, locale }: Props) {
  const [games, setGames] = useState(initialGames);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingGameId, setConfirmingGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = getCopy(locale);

  async function runAction(gameId: string, action: OwnerAction) {
    setPendingId(gameId);
    setError(null);

    try {
      const response = await fetch(`/api/my-games/${gameId}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Action failed.');
      }

      if (action === 'delete') {
        setGames((current) =>
          current.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  status: 'REMOVED',
                  is_hidden: true,
                  hidden_reason: 'Removed by owner'
                }
              : game
          )
        );
        return;
      }

      if (data.game) {
        setGames((current) => current.map((game) => (game.id === gameId ? data.game ?? game : game)));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      setPendingId(null);
    }
  }

  if (!games.length) {
    return (
      <section className="empty-state-card">
        <h2>{copy.empty}</h2>
        <a href="/submit" className="button-primary">
          {copy.create}
        </a>
      </section>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={Boolean(confirmingGameId)}
        title={copy.deleteTitle}
        message={copy.deleteMessage}
        confirmLabel={copy.delete}
        cancelLabel={copy.cancel}
        pending={Boolean(confirmingGameId && pendingId === confirmingGameId)}
        onClose={() => {
          if (!pendingId) {
            setConfirmingGameId(null);
          }
        }}
        onConfirm={() => {
          if (confirmingGameId) {
            void runAction(confirmingGameId, 'delete').finally(() => setConfirmingGameId(null));
          }
        }}
      />

      <section className="my-games-grid">
        {error ? <p className="error-text">{error}</p> : null}
        {games.map((game) => {
          const imageUrl = game.thumbnail_path ? getGameAssetUrl(game.id, game.thumbnail_path) : getPlaceholderThumbnailDataUrl(game.title);
          const statusLabel = getStatusLabel(game, copy);
          const isPending = pendingId === game.id;
          const isDraft = game.status === 'DRAFT';
          const primaryAction = getPrimaryOwnerAction(game);
          const renderPrimaryFirst = shouldRenderPrimaryOwnerActionFirst(game);
          const primaryActionButton = game.status !== 'REMOVED' ? (
            <button
              type="button"
              className={getPrimaryOwnerActionClassName(primaryAction)}
              onClick={() => void runAction(game.id, primaryAction)}
              disabled={isPending}
            >
              {isPending ? copy.deleting : getPrimaryActionLabel(game, copy)}
            </button>
          ) : null;

          return (
            <article key={game.id} className="panel-card my-game-card">
              <div className="my-game-card-media">
                <Image src={imageUrl} alt={game.title} fill className="game-card-image" unoptimized />
              </div>
              <div className="my-game-card-body">
                <div className="my-game-card-head">
                  <div>
                    <h2>{game.title}</h2>
                    <p className="small-copy">
                      {copy.createdAt}: {formatDate(game.created_at)}
                    </p>
                  </div>
                  <span className={`my-game-status${isDraft && !game.is_hidden ? ' is-draft' : ''}`}>{statusLabel}</span>
                </div>
                <p>{game.description}</p>
                <div className="game-card-stats">
                  <span>{copy.likes} {game.like_count}</span>
                  <span>{copy.dislikes} {game.dislike_count}</span>
                  <span>{copy.plays} {Math.max(0, Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2))}</span>
                </div>
                <div className="button-row my-game-actions">
                  {renderPrimaryFirst ? primaryActionButton : null}
                  <a href={`/game/${game.slug}`} className="button-secondary">
                    {isDraft ? copy.preview : copy.open}
                  </a>
                  {game.status !== 'REMOVED' ? <a href={`/my-games/${game.id}/edit`} className="button-secondary">{copy.edit}</a> : null}
                  {!renderPrimaryFirst ? primaryActionButton : null}
                  {game.status !== 'REMOVED' ? (
                    <button
                      type="button"
                      className="button-ghost danger-button"
                      onClick={() => setConfirmingGameId(game.id)}
                      disabled={isPending}
                    >
                      {isPending ? copy.deleting : copy.delete}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
