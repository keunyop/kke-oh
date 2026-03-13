'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
        summaryTotal: '\uC804\uCCB4 \uAC8C\uC784',
        summaryVisible: '\uACF5\uAC1C \uC911',
        summaryHidden: '\uC228\uAE40',
        summaryReported: '\uC2E0\uACE0 \uBC1B\uC74C',
        summaryRemoved: '\uC0AD\uC81C\uB428',
        toolbarTitle: '\uBE60\uB978 \uD544\uD130',
        searchPlaceholder: '\uC81C\uBAA9, \uC791\uC131\uC790, ID\uB85C \uCC3E\uAE30',
        refresh: '\uC0C8\uB85C\uACE0\uCE68',
        refreshing: '\uBD88\uB7EC\uC624\uB294 \uC911...',
        empty: '\uC870\uAC74\uC5D0 \uB9DE\uB294 \uAC8C\uC784\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
        uploader: '\uC791\uC131\uC790',
        gameId: 'Game ID',
        createdAt: '\uB4F1\uB85D',
        updatedAt: '\uC218\uC815',
        reports: '\uC2E0\uACE0',
        likes: '\uC88B\uC544\uC694',
        dislikes: '\uC2EB\uC5B4\uC694',
        plays: '\uD50C\uB808\uC774',
        hiddenReason: '\uC228\uAE40 \uC0AC\uC720',
        preview: '\uBBF8\uB9AC\uBCF4\uAE30',
        page: '\uAC8C\uC784 \uD398\uC774\uC9C0',
        hide: '\uC228\uAE30\uAE30',
        unhide: '\uB2E4\uC2DC \uACF5\uAC1C',
        remove: '\uC0AD\uC81C',
        removed: '\uC0AD\uC81C\uB428',
        pending: '\uCC98\uB9AC \uC911...',
        confirmDelete: '\uC774 \uAC8C\uC784\uC744 \uC0AD\uC81C \uCC98\uB9AC\uD560\uAE4C\uC694?',
        successHide: '\uAC8C\uC784\uC744 \uC228\uAE40 \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4.',
        successUnhide: '\uAC8C\uC784\uC744 \uB2E4\uC2DC \uACF5\uAC1C\uD588\uC2B5\uB2C8\uB2E4.',
        successDelete: '\uAC8C\uC784\uC744 \uC0AD\uC81C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4.',
        visible: '\uACF5\uAC1C',
        hidden: '\uC228\uAE40',
        reported: '\uC2E0\uACE0 \uC788\uC74C',
        flagged: 'CDN Flag',
        all: '\uC804\uCCB4',
        filterVisible: '\uACF5\uAC1C',
        filterHidden: '\uC228\uAE40',
        filterReported: '\uC2E0\uACE0',
        filterFlagged: '\uD50C\uB798\uADF8',
        filterRemoved: '\uC0AD\uC81C\uB428',
        removedStatus: '\uC0AD\uC81C\uB428',
        publicStatus: '\uACF5\uAC1C',
        hiddenStatus: '\uBE44\uACF5\uAC1C',
        reviewHint: '\uC2E0\uACE0 \uB610\uB294 CDN \uD50C\uB798\uADF8 \uC0C1\uD0DC\uB97C \uC6B0\uC120 \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
        signedIn: '\uAD00\uB9AC \uACC4\uC815'
      }
    : {
        summaryTotal: 'Total games',
        summaryVisible: 'Visible',
        summaryHidden: 'Hidden',
        summaryReported: 'Reported',
        summaryRemoved: 'Removed',
        toolbarTitle: 'Quick filters',
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
        preview: 'Preview build',
        page: 'Open game page',
        hide: 'Hide',
        unhide: 'Unhide',
        remove: 'Delete',
        removed: 'Removed',
        pending: 'Working...',
        confirmDelete: 'Delete this game from the public catalog?',
        successHide: 'The game is now hidden.',
        successUnhide: 'The game is visible again.',
        successDelete: 'The game has been removed.',
        visible: 'Visible',
        hidden: 'Hidden',
        reported: 'Reported',
        flagged: 'CDN Flag',
        all: 'All',
        filterVisible: 'Visible',
        filterHidden: 'Hidden',
        filterReported: 'Reported',
        filterFlagged: 'Flagged',
        filterRemoved: 'Removed',
        removedStatus: 'Removed',
        publicStatus: 'Public',
        hiddenStatus: 'Hidden',
        reviewHint: 'Prioritize items that have reports or CDN flags.',
        signedIn: 'Signed in as admin'
      };
}

function formatDate(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

function getPlayScore(game: GameRecord) {
  return Math.max(0, Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2));
}

function matchesFilter(game: GameRecord, filter: FilterKey) {
  if (filter === 'visible') {
    return game.status === 'PUBLIC' && !game.is_hidden;
  }

  if (filter === 'hidden') {
    return game.is_hidden && game.status !== 'REMOVED';
  }

  if (filter === 'reported') {
    return game.report_count > 0;
  }

  if (filter === 'flagged') {
    return game.allowlist_violation;
  }

  if (filter === 'removed') {
    return game.status === 'REMOVED';
  }

  return true;
}

function getStatusLabel(game: GameRecord, copy: ReturnType<typeof getCopy>) {
  if (game.status === 'REMOVED') return copy.removedStatus;
  if (game.is_hidden) return copy.hiddenStatus;
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

    const haystack = [
      game.id,
      game.title,
      game.description,
      game.uploader_name,
      game.hidden_reason ?? ''
    ]
      .join(' ')
      .toLowerCase();

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
      setNotice(
        action === 'hide' ? copy.successHide : action === 'unhide' ? copy.successUnhide : copy.successDelete
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Admin action failed.');
    } finally {
      setPendingId(null);
    }
  }

  function requestDelete(game: GameRecord) {
    setConfirmingGame(game);
    setError(null);
    setNotice(null);
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
          <span className="pill-label">{copy.toolbarTitle}</span>
          <h2>{copy.reviewHint}</h2>
          <p>
            {copy.signedIn}: {adminLoginId}
          </p>
        </div>
        <div className="admin-toolbar-controls">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
          />
          <div className="admin-filter-row">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`button-ghost admin-filter${filter === item.key ? ' is-active' : ''}`}
                onClick={() => setFilter(item.key)}
              >
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

            return (
              <article key={game.id} className="panel-card admin-game-card">
                <div className="admin-game-head">
                  <div>
                    <div className="admin-chip-row">
                      <span className="admin-chip admin-chip-status">{statusLabel}</span>
                      {game.report_count > 0 ? <span className="admin-chip">{copy.reported}</span> : null}
                      {game.allowlist_violation ? <span className="admin-chip admin-chip-warning">{copy.flagged}</span> : null}
                    </div>
                    <h2>{game.title}</h2>
                    <p>{game.description || game.id}</p>
                  </div>
                  <div className="admin-card-actions">
                    {showPreview ? (
                      <a
                        href={getGameAssetUrl(game.id, game.entry_path)}
                        className="button-secondary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.preview}
                      </a>
                    ) : null}
                    {showGamePageLink ? (
                      <a href={`/game/${game.id}`} className="button-secondary" target="_blank" rel="noreferrer">
                        {copy.page}
                      </a>
                    ) : null}
                    {game.status !== 'REMOVED' ? (
                      <button
                        type="button"
                        className="button-ghost"
                        onClick={() => void runAction(game, game.is_hidden ? 'unhide' : 'hide')}
                        disabled={isPending}
                      >
                        {isPending ? copy.pending : game.is_hidden ? copy.unhide : copy.hide}
                      </button>
                    ) : null}
                    {game.status !== 'REMOVED' ? (
                      <button
                        type="button"
                        className="button-ghost admin-danger-button"
                        onClick={() => requestDelete(game)}
                        disabled={isPending}
                      >
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
