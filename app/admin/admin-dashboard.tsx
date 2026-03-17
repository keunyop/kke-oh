'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import { getGameAssetUrl } from '@/lib/games/urls';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type Props = {
  initialGames: GameRecord[];
  locale: Locale;
  adminLoginId: string;
};

type FilterKey = 'all' | 'visible' | 'hidden' | 'reported' | 'flagged' | 'removed';
type AdminAction = 'hide' | 'unhide' | 'delete';
type AdminGamesResponse = {
  games?: GameRecord[];
  error?: string;
};
type AdminActionResponse = {
  success?: boolean;
  error?: string;
};

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        summaryTotal: '전체 게임',
        summaryVisible: '공개 중',
        summaryHidden: '숨김',
        summaryReported: '신고 받음',
        summaryRemoved: '삭제됨',
        searchPlaceholder: '제목, 작성자, 게임 ID로 찾기',
        refresh: '새로고침',
        refreshing: '불러오는 중...',
        empty: '조건에 맞는 게임이 없어요.',
        uploader: '작성자',
        gameId: 'Game ID',
        createdAt: '등록',
        updatedAt: '수정',
        reports: '신고',
        likes: '좋아요',
        dislikes: '싫어요',
        plays: '플레이',
        hiddenReason: '숨김 사유',
        preview: '미리보기',
        page: '게임 페이지',
        hide: '숨기기',
        unhide: '다시 공개',
        remove: '삭제',
        removed: '삭제됨',
        pending: '처리 중...',
        confirmDelete: '이 게임을 삭제 처리할까요?',
        successHide: '게임을 숨겼어요.',
        successUnhide: '게임을 다시 공개했어요.',
        successDelete: '게임을 삭제 처리했어요.',
        reported: '신고 있음',
        flagged: '플래그',
        all: '전체',
        filterVisible: '공개',
        filterHidden: '숨김',
        filterReported: '신고',
        filterFlagged: '플래그',
        filterRemoved: '삭제됨',
        removedStatus: '삭제됨',
        draftStatus: '초안',
        publicStatus: '공개',
        hiddenStatus: '숨김',
        reviewHint: '신고나 플래그가 있는 항목부터 먼저 확인해 주세요.',
        leaderboard: '리더보드',
        leaderboardOn: '켜짐',
        leaderboardOff: '꺼짐',
        signedIn: '관리 계정'
      }
    : {
        summaryTotal: 'Total games',
        summaryVisible: 'Visible',
        summaryHidden: 'Hidden',
        summaryReported: 'Reported',
        summaryRemoved: 'Removed',
        searchPlaceholder: 'Search by title, creator, or game ID',
        refresh: 'Refresh',
        refreshing: 'Refreshing...',
        empty: 'No games match the current filter.',
        uploader: 'Uploader',
        gameId: 'Game ID',
        createdAt: 'Created',
        updatedAt: 'Updated',
        reports: 'Reports',
        likes: 'Likes',
        dislikes: 'Dislikes',
        plays: 'Plays',
        hiddenReason: 'Hidden reason',
        preview: 'Preview',
        page: 'Game page',
        hide: 'Hide',
        unhide: 'Show again',
        remove: 'Delete',
        removed: 'Removed',
        pending: 'Working...',
        confirmDelete: 'Delete this game?',
        successHide: 'The game is hidden.',
        successUnhide: 'The game is public again.',
        successDelete: 'The game has been removed.',
        reported: 'Reported',
        flagged: 'Flagged',
        all: 'All',
        filterVisible: 'Visible',
        filterHidden: 'Hidden',
        filterReported: 'Reported',
        filterFlagged: 'Flagged',
        filterRemoved: 'Removed',
        removedStatus: 'Removed',
        draftStatus: 'Draft',
        publicStatus: 'Public',
        hiddenStatus: 'Hidden',
        reviewHint: 'Prioritize items with reports or flags.',
        leaderboard: 'Leaderboard',
        leaderboardOn: 'On',
        leaderboardOff: 'Off',
        signedIn: 'Admin account'
      };
}

function formatDate(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

function getPlayScore(game: GameRecord) {
  return Math.max(0, Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2));
}

function matchesFilter(game: GameRecord, filter: FilterKey) {
  if (filter === 'visible') return game.status === 'PUBLIC' && !game.is_hidden;
  if (filter === 'hidden') return game.is_hidden && game.status !== 'REMOVED';
  if (filter === 'reported') return game.report_count > 0;
  if (filter === 'flagged') return game.allowlist_violation;
  if (filter === 'removed') return game.status === 'REMOVED';
  return true;
}

function getStatusLabel(game: GameRecord, copy: ReturnType<typeof getCopy>) {
  if (game.status === 'REMOVED') return copy.removedStatus;
  if (game.is_hidden) return copy.hiddenStatus;
  if (game.status === 'DRAFT') return copy.draftStatus;
  return copy.publicStatus;
}

export default function AdminDashboard({ initialGames, locale, adminLoginId }: Props) {
  const copy = getCopy(locale);
  const [games, setGames] = useState(initialGames);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingGame, setConfirmingGame] = useState<GameRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalGames = games.length;
  const visibleGamesCount = games.filter((game) => game.status === 'PUBLIC' && !game.is_hidden).length;
  const hiddenGamesCount = games.filter((game) => game.is_hidden && game.status !== 'REMOVED').length;
  const reportedGamesCount = games.filter((game) => game.report_count > 0).length;
  const removedGamesCount = games.filter((game) => game.status === 'REMOVED').length;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGames = games.filter((game) => {
    if (!matchesFilter(game, filter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [game.id, game.title, game.description, game.uploader_name, game.hidden_reason ?? ''].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const summaryCards = [
    { label: copy.summaryTotal, value: totalGames },
    { label: copy.summaryVisible, value: visibleGamesCount },
    { label: copy.summaryHidden, value: hiddenGamesCount },
    { label: copy.summaryReported, value: reportedGamesCount },
    { label: copy.summaryRemoved, value: removedGamesCount }
  ];

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: copy.all },
    { key: 'visible', label: copy.filterVisible },
    { key: 'hidden', label: copy.filterHidden },
    { key: 'reported', label: copy.filterReported },
    { key: 'flagged', label: copy.filterFlagged },
    { key: 'removed', label: copy.filterRemoved }
  ];

  function patchGame(gameId: string, action: AdminAction) {
    setGames((current) =>
      current.map((game) => {
        if (game.id !== gameId) {
          return game;
        }

        if (action === 'hide') {
          return {
            ...game,
            is_hidden: true,
            hidden_reason: 'Hidden by admin',
            updated_at: new Date().toISOString()
          };
        }

        if (action === 'unhide') {
          return {
            ...game,
            is_hidden: false,
            hidden_reason: null,
            updated_at: new Date().toISOString()
          };
        }

        return {
          ...game,
          status: 'REMOVED',
          is_hidden: true,
          hidden_reason: 'Removed by admin',
          updated_at: new Date().toISOString()
        };
      })
    );
  }

  async function refreshGames() {
    setError(null);
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/admin/games', {
        method: 'GET',
        cache: 'no-store'
      });
      const data = (await response.json()) as AdminGamesResponse;

      if (!response.ok || !data.games) {
        throw new Error(data.error ?? 'Could not refresh the admin list.');
      }

      setGames(data.games);
      setNotice(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not refresh the admin list.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function runAction(game: GameRecord, action: AdminAction) {
    setPendingId(game.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/games/${game.id}/${action}`, {
        method: 'POST'
      });
      const data = (await response.json()) as AdminActionResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Admin action failed.');
      }

      patchGame(game.id, action);
      setNotice(action === 'hide' ? copy.successHide : action === 'unhide' ? copy.successUnhide : copy.successDelete);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Admin action failed.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="panel-card admin-summary-card">
            <p className="small-copy">{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel-card admin-toolbar">
        <div className="admin-toolbar-copy">
          <h2>{copy.reviewHint}</h2>
          <p>{copy.signedIn}: {adminLoginId}</p>
        </div>
        <div className="admin-toolbar-controls">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} aria-label={copy.searchPlaceholder} />
          <div className="admin-filter-row">
            {filters.map((item) => (
              <button key={item.key} type="button" className={`button-ghost admin-filter${filter === item.key ? ' is-active' : ''}`} onClick={() => setFilter(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="button-secondary" onClick={() => void refreshGames()} disabled={isRefreshing}>
            {isRefreshing ? copy.refreshing : copy.refresh}
          </button>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}
      <ConfirmDialog
        open={Boolean(confirmingGame)}
        title={copy.remove}
        message={copy.confirmDelete}
        confirmLabel={copy.remove}
        cancelLabel={locale === 'ko' ? '취소' : 'Cancel'}
        pending={Boolean(confirmingGame && pendingId === confirmingGame.id)}
        onClose={() => {
          if (!pendingId) {
            setConfirmingGame(null);
          }
        }}
        onConfirm={() => {
          if (confirmingGame) {
            void runAction(confirmingGame, 'delete').finally(() => setConfirmingGame(null));
          }
        }}
      />

      {visibleGames.length ? (
        <section className="admin-game-grid">
          {visibleGames.map((game) => {
            const statusLabel = getStatusLabel(game, copy);
            const isPending = pendingId === game.id;
            const showPreview = game.entry_path !== '';
            const showGamePageLink = game.status === 'PUBLIC' && !game.is_hidden;
            const imageUrl = game.thumbnail_path ? getGameAssetUrl(game.id, game.thumbnail_path) : getPlaceholderThumbnailDataUrl(game.title);

            return (
              <article key={game.id} className="panel-card admin-game-card">
                <div className="admin-game-head">
                  <div className="admin-game-media">
                    <Image src={imageUrl} alt={game.title} fill className="game-card-image" unoptimized />
                  </div>
                  <div className="admin-game-copy">
                    <div className="admin-chip-row">
                      <span className="admin-chip admin-chip-status">{statusLabel}</span>
                      {game.report_count > 0 ? <span className="admin-chip">{copy.reported}</span> : null}
                      {game.allowlist_violation ? <span className="admin-chip admin-chip-warning">{copy.flagged}</span> : null}
                      <span className="admin-chip">{copy.leaderboard} {game.leaderboard_enabled ? copy.leaderboardOn : copy.leaderboardOff}</span>
                    </div>
                    <h2>{game.title}</h2>
                    <p>{game.description || game.id}</p>
                  </div>
                  <div className="admin-card-actions">
                    {showPreview ? <a href={getGameAssetUrl(game.id, game.entry_path)} className="button-secondary" target="_blank" rel="noreferrer">{copy.preview}</a> : null}
                    {showGamePageLink ? <a href={`/game/${game.slug}`} className="button-secondary" target="_blank" rel="noreferrer">{copy.page}</a> : null}
                    {game.status !== 'REMOVED' ? (
                      <button type="button" className="button-ghost" onClick={() => void runAction(game, game.is_hidden ? 'unhide' : 'hide')} disabled={isPending}>
                        {isPending ? copy.pending : game.is_hidden ? copy.unhide : copy.hide}
                      </button>
                    ) : null}
                    {game.status !== 'REMOVED' ? (
                      <button type="button" className="button-ghost danger-button" onClick={() => setConfirmingGame(game)} disabled={isPending}>
                        {isPending ? copy.pending : copy.remove}
                      </button>
                    ) : (
                      <span className="admin-removed-label">{copy.removed}</span>
                    )}
                  </div>
                </div>

                <dl className="admin-meta-grid">
                  <div>
                    <dt>{copy.uploader}</dt>
                    <dd>{game.uploader_name}</dd>
                  </div>
                  <div>
                    <dt>{copy.gameId}</dt>
                    <dd>{game.id}</dd>
                  </div>
                  <div>
                    <dt>{copy.createdAt}</dt>
                    <dd>{formatDate(game.created_at)}</dd>
                  </div>
                  <div>
                    <dt>{copy.updatedAt}</dt>
                    <dd>{formatDate(game.updated_at)}</dd>
                  </div>
                </dl>

                <div className="game-card-stats admin-stats-row">
                  <span>{copy.reports} {game.report_count}</span>
                  <span>{copy.likes} {game.like_count}</span>
                  <span>{copy.dislikes} {game.dislike_count}</span>
                  <span>{copy.plays} {getPlayScore(game)}</span>
                </div>

                {game.hidden_reason ? (
                  <div className="admin-hidden-reason">
                    <strong>{copy.hiddenReason}</strong>
                    <p>{game.hidden_reason}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-state-card">
          <h2>{copy.empty}</h2>
        </section>
      )}
    </div>
  );
}

