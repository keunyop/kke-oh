'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { dispatchPointBalanceUpdated } from '@/point-balance-events';
import type { AdminUserPointRecord } from '@/lib/admin/service';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import { getGameAssetUrl } from '@/lib/games/urls';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type Props = {
  initialGames: GameRecord[];
  initialUsers: AdminUserPointRecord[];
  locale: Locale;
  adminLoginId: string;
  adminUserId: string;
};

type GameFilterKey = 'all' | 'visible' | 'hidden' | 'reported' | 'flagged' | 'removed';
type UserFilterKey = 'all' | 'with-points' | 'zero-points';
type AdminAction = 'hide' | 'unhide' | 'delete';
type AdminTab = 'games' | 'users';
type AdminGamesResponse = {
  games?: GameRecord[];
  error?: string;
};
type AdminUsersResponse = {
  users?: AdminUserPointRecord[];
  error?: string;
};
type AdminActionResponse = {
  success?: boolean;
  error?: string;
};
type AdminPointUpdateResponse = {
  success?: boolean;
  balance?: number;
  changed?: boolean;
  updatedAt?: string;
  error?: string;
};

function getCopy(locale: Locale) {
  const isKo = locale === 'ko';

  return {
    gamesTab: isKo ? 'Game management' : 'Game moderation',
    usersTab: isKo ? 'User points' : 'User points',
    summaryTotal: isKo ? 'Total games' : 'Total games',
    summaryVisible: isKo ? 'Visible' : 'Visible',
    summaryHidden: isKo ? 'Hidden' : 'Hidden',
    summaryReported: isKo ? 'Reported' : 'Reported',
    summaryRemoved: isKo ? 'Removed' : 'Removed',
    summaryUsers: isKo ? 'Users' : 'Users',
    summaryUsersWithPoints: isKo ? 'Point holders' : 'Point holders',
    summaryZeroPointUsers: isKo ? 'Zero-point users' : 'Zero-point users',
    summaryTotalPoints: isKo ? 'Total points' : 'Total points',
    searchPlaceholder: isKo ? 'Search by title, uploader, or game ID' : 'Search by title, uploader, or game ID',
    userSearchPlaceholder: isKo ? 'Search by login ID or user ID' : 'Search by login ID or user ID',
    refresh: isKo ? 'Refresh' : 'Refresh',
    refreshing: isKo ? 'Refreshing...' : 'Refreshing...',
    emptyGames: isKo ? 'No games match the current filter.' : 'No games match the current filter.',
    emptyUsers: isKo ? 'No users match the current filter.' : 'No users match the current filter.',
    uploader: isKo ? 'Uploader' : 'Uploader',
    gameId: 'Game ID',
    userId: isKo ? 'User ID' : 'User ID',
    createdAt: isKo ? 'Created' : 'Created',
    updatedAt: isKo ? 'Updated' : 'Updated',
    joinedAt: isKo ? 'Joined' : 'Joined',
    reports: isKo ? 'Reports' : 'Reports',
    likes: isKo ? 'Likes' : 'Likes',
    dislikes: isKo ? 'Dislikes' : 'Dislikes',
    plays: isKo ? 'Plays' : 'Plays',
    hiddenReason: isKo ? 'Hidden reason' : 'Hidden reason',
    preview: isKo ? 'Preview' : 'Preview',
    page: isKo ? 'Game page' : 'Game page',
    hide: isKo ? 'Hide' : 'Hide',
    unhide: isKo ? 'Show again' : 'Show again',
    remove: isKo ? 'Delete' : 'Delete',
    removed: isKo ? 'Removed' : 'Removed',
    pending: isKo ? 'Working...' : 'Working...',
    confirmDelete: isKo ? 'Delete this game?' : 'Delete this game?',
    successHide: isKo ? 'The game is hidden.' : 'The game is hidden.',
    successUnhide: isKo ? 'The game is public again.' : 'The game is public again.',
    successDelete: isKo ? 'The game has been removed.' : 'The game has been removed.',
    reported: isKo ? 'Reported' : 'Reported',
    flagged: isKo ? 'Flagged' : 'Flagged',
    all: isKo ? 'All' : 'All',
    filterVisible: isKo ? 'Visible' : 'Visible',
    filterHidden: isKo ? 'Hidden' : 'Hidden',
    filterReported: isKo ? 'Reported' : 'Reported',
    filterFlagged: isKo ? 'Flagged' : 'Flagged',
    filterRemoved: isKo ? 'Removed' : 'Removed',
    allUsers: isKo ? 'All users' : 'All users',
    usersWithPoints: isKo ? 'Has points' : 'Has points',
    usersZeroPoints: isKo ? 'Zero points' : 'Zero points',
    removedStatus: isKo ? 'Removed' : 'Removed',
    draftStatus: isKo ? 'Draft' : 'Draft',
    publicStatus: isKo ? 'Public' : 'Public',
    hiddenStatus: isKo ? 'Hidden' : 'Hidden',
    reviewHint: isKo ? 'Prioritize items with reports or flags.' : 'Prioritize items with reports or flags.',
    userReviewHint: isKo ? 'Review members and correct point balances when needed.' : 'Review members and correct point balances when needed.',
    leaderboard: isKo ? 'Leaderboard' : 'Leaderboard',
    leaderboardOn: isKo ? 'On' : 'On',
    leaderboardOff: isKo ? 'Off' : 'Off',
    signedIn: isKo ? 'Admin account' : 'Admin account',
    pointBalance: isKo ? 'Current points' : 'Current points',
    currentBalance: isKo ? 'Current points' : 'Current points',
    targetBalance: isKo ? 'Target balance' : 'Target balance',
    targetBalanceHint: isKo ? 'Enter a whole number. Saving sets the final balance.' : 'Enter a whole number. Saving sets the final balance.',
    pointUpdatedAt: isKo ? 'Last point update' : 'Last point update',
    notUpdatedYet: isKo ? 'No updates yet' : 'No updates yet',
    saveBalance: isKo ? 'Save balance' : 'Save balance',
    savingBalance: isKo ? 'Saving...' : 'Saving...',
    invalidBalance: isKo ? 'Point balances must be whole numbers zero or greater.' : 'Point balances must be whole numbers zero or greater.',
    noBalanceChange: isKo ? 'There is no point change to save.' : 'There is no point change to save.',
    successPointSaved: isKo ? 'The user point balance was updated.' : 'The user point balance was updated.'
  };
}

function formatDate(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

function getPlayScore(game: GameRecord) {
  return Math.max(0, Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2));
}

function matchesGameFilter(game: GameRecord, filter: GameFilterKey) {
  if (filter === 'visible') return game.status === 'PUBLIC' && !game.is_hidden;
  if (filter === 'hidden') return game.is_hidden && game.status !== 'REMOVED';
  if (filter === 'reported') return game.report_count > 0;
  if (filter === 'flagged') return game.allowlist_violation;
  if (filter === 'removed') return game.status === 'REMOVED';
  return true;
}

function matchesUserFilter(user: AdminUserPointRecord, filter: UserFilterKey) {
  if (filter === 'with-points') return user.pointBalance > 0;
  if (filter === 'zero-points') return user.pointBalance === 0;
  return true;
}

function getStatusLabel(game: GameRecord, copy: ReturnType<typeof getCopy>) {
  if (game.status === 'REMOVED') return copy.removedStatus;
  if (game.is_hidden) return copy.hiddenStatus;
  if (game.status === 'DRAFT') return copy.draftStatus;
  return copy.publicStatus;
}

function buildUserDraftBalances(users: AdminUserPointRecord[]) {
  return Object.fromEntries(users.map((user) => [user.userId, String(user.pointBalance)]));
}

function parseTargetBalance(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export default function AdminDashboard({ initialGames, initialUsers, locale, adminLoginId, adminUserId }: Props) {
  const copy = getCopy(locale);
  const [activeTab, setActiveTab] = useState<AdminTab>('games');
  const [games, setGames] = useState(initialGames);
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<GameFilterKey>('all');
  const [userQuery, setUserQuery] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilterKey>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [userDraftBalances, setUserDraftBalances] = useState<Record<string, string>>(() => buildUserDraftBalances(initialUsers));
  const [confirmingGame, setConfirmingGame] = useState<GameRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalGames = games.length;
  const visibleGamesCount = games.filter((game) => game.status === 'PUBLIC' && !game.is_hidden).length;
  const hiddenGamesCount = games.filter((game) => game.is_hidden && game.status !== 'REMOVED').length;
  const reportedGamesCount = games.filter((game) => game.report_count > 0).length;
  const removedGamesCount = games.filter((game) => game.status === 'REMOVED').length;
  const totalUsers = users.length;
  const usersWithPointsCount = users.filter((user) => user.pointBalance > 0).length;
  const zeroPointUsersCount = users.filter((user) => user.pointBalance === 0).length;
  const totalPoints = users.reduce((sum, user) => sum + user.pointBalance, 0);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGames = games.filter((game) => {
    if (!matchesGameFilter(game, filter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [game.id, game.title, game.description, game.uploader_name, game.hidden_reason ?? ''].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const normalizedUserQuery = userQuery.trim().toLowerCase();
  const visibleUsers = users.filter((user) => {
    if (!matchesUserFilter(user, userFilter)) {
      return false;
    }

    if (!normalizedUserQuery) {
      return true;
    }

    const haystack = [user.userId, user.loginId, String(user.pointBalance)].join(' ').toLowerCase();
    return haystack.includes(normalizedUserQuery);
  });

  const gameSummaryCards = [
    { label: copy.summaryTotal, value: totalGames },
    { label: copy.summaryVisible, value: visibleGamesCount },
    { label: copy.summaryHidden, value: hiddenGamesCount },
    { label: copy.summaryReported, value: reportedGamesCount },
    { label: copy.summaryRemoved, value: removedGamesCount }
  ];

  const userSummaryCards = [
    { label: copy.summaryUsers, value: totalUsers },
    { label: copy.summaryUsersWithPoints, value: usersWithPointsCount },
    { label: copy.summaryZeroPointUsers, value: zeroPointUsersCount },
    { label: copy.summaryTotalPoints, value: `${totalPoints}P` }
  ];

  const gameFilters: Array<{ key: GameFilterKey; label: string }> = [
    { key: 'all', label: copy.all },
    { key: 'visible', label: copy.filterVisible },
    { key: 'hidden', label: copy.filterHidden },
    { key: 'reported', label: copy.filterReported },
    { key: 'flagged', label: copy.filterFlagged },
    { key: 'removed', label: copy.filterRemoved }
  ];

  const userFilters: Array<{ key: UserFilterKey; label: string }> = [
    { key: 'all', label: copy.allUsers },
    { key: 'with-points', label: copy.usersWithPoints },
    { key: 'zero-points', label: copy.usersZeroPoints }
  ];

  const summaryCards = activeTab === 'games' ? gameSummaryCards : userSummaryCards;

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

  async function refreshUsers() {
    setError(null);
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        cache: 'no-store'
      });
      const data = (await response.json()) as AdminUsersResponse;

      if (!response.ok || !data.users) {
        throw new Error(data.error ?? 'Could not refresh the admin user list.');
      }

      setUsers(data.users);
      setUserDraftBalances(buildUserDraftBalances(data.users));
      setNotice(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not refresh the admin user list.');
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

  async function saveUserBalance(user: AdminUserPointRecord) {
    const targetBalance = parseTargetBalance(userDraftBalances[user.userId] ?? '');

    if (targetBalance === null) {
      setError(copy.invalidBalance);
      setNotice(null);
      return;
    }

    if (targetBalance === user.pointBalance) {
      setNotice(copy.noBalanceChange);
      setError(null);
      return;
    }

    setPendingUserId(user.userId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/users/${user.userId}/points`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ targetBalance })
      });
      const data = (await response.json()) as AdminPointUpdateResponse;

      if (!response.ok || typeof data.balance !== 'number') {
        throw new Error(data.error ?? 'Could not update the user point balance.');
      }

      const updatedBalance = data.balance;

      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId
            ? {
                ...item,
                pointBalance: updatedBalance,
                pointUpdatedAt: data.updatedAt ?? new Date().toISOString()
              }
            : item
        )
      );
      setUserDraftBalances((current) => ({
        ...current,
        [user.userId]: String(updatedBalance)
      }));
      setNotice(data.changed ? copy.successPointSaved : copy.noBalanceChange);

      if (user.userId === adminUserId) {
        dispatchPointBalanceUpdated(updatedBalance);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the user point balance.');
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="admin-dashboard">
      <section className="panel-card admin-tab-bar">
        <button type="button" className={`button-ghost admin-tab-button${activeTab === 'games' ? ' is-active' : ''}`} onClick={() => setActiveTab('games')}>
          {copy.gamesTab}
        </button>
        <button type="button" className={`button-ghost admin-tab-button${activeTab === 'users' ? ' is-active' : ''}`} onClick={() => setActiveTab('users')}>
          {copy.usersTab}
        </button>
      </section>

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
          <h2>{activeTab === 'games' ? copy.reviewHint : copy.userReviewHint}</h2>
          <p>{copy.signedIn}: {adminLoginId}</p>
        </div>
        <div className="admin-toolbar-controls">
          {activeTab === 'games' ? (
            <>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchPlaceholder}
              />
              <div className="admin-filter-row">
                {gameFilters.map((item) => (
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
            </>
          ) : (
            <>
              <input
                type="search"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder={copy.userSearchPlaceholder}
                aria-label={copy.userSearchPlaceholder}
              />
              <div className="admin-filter-row">
                {userFilters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`button-ghost admin-filter${userFilter === item.key ? ' is-active' : ''}`}
                    onClick={() => setUserFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button type="button" className="button-secondary" onClick={() => void (activeTab === 'games' ? refreshGames() : refreshUsers())} disabled={isRefreshing}>
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
        cancelLabel="Cancel"
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

      {activeTab === 'games' ? (
        visibleGames.length ? (
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
            <h2>{copy.emptyGames}</h2>
          </section>
        )
      ) : visibleUsers.length ? (
        <section className="admin-user-grid">
          {visibleUsers.map((user) => {
            const draftBalance = userDraftBalances[user.userId] ?? String(user.pointBalance);
            const parsedTargetBalance = parseTargetBalance(draftBalance);
            const isPending = pendingUserId === user.userId;
            const canSave = parsedTargetBalance !== null && parsedTargetBalance !== user.pointBalance && !isPending;

            return (
              <article key={user.userId} className="panel-card admin-user-card">
                <div className="admin-user-head">
                  <div className="admin-user-copy">
                    <div className="admin-chip-row">
                      <span className="admin-chip admin-chip-status">{copy.currentBalance} {user.pointBalance}P</span>
                      <span className={`admin-chip${user.pointBalance === 0 ? ' admin-chip-warning' : ''}`}>
                        {user.pointBalance > 0 ? copy.usersWithPoints : copy.usersZeroPoints}
                      </span>
                    </div>
                    <h2>{user.loginId}</h2>
                    <p>{user.userId}</p>
                  </div>

                  <form
                    className="admin-point-editor"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveUserBalance(user);
                    }}
                  >
                    <label htmlFor={`admin-target-balance-${user.userId}`} className="small-copy">
                      {copy.targetBalance}
                    </label>
                    <div className="admin-point-editor-row">
                      <input
                        id={`admin-target-balance-${user.userId}`}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={draftBalance}
                        onChange={(event) =>
                          setUserDraftBalances((current) => ({
                            ...current,
                            [user.userId]: event.target.value
                          }))
                        }
                        aria-invalid={draftBalance.trim().length > 0 && parsedTargetBalance === null}
                      />
                      <button type="submit" className="button-secondary" disabled={!canSave}>
                        {isPending ? copy.savingBalance : copy.saveBalance}
                      </button>
                    </div>
                    <p className="small-copy">{copy.targetBalanceHint}</p>
                  </form>
                </div>

                <dl className="admin-meta-grid admin-user-meta-grid">
                  <div>
                    <dt>{copy.userId}</dt>
                    <dd>{user.userId}</dd>
                  </div>
                  <div>
                    <dt>{copy.joinedAt}</dt>
                    <dd>{formatDate(user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>{copy.pointBalance}</dt>
                    <dd>{user.pointBalance}P</dd>
                  </div>
                  <div>
                    <dt>{copy.pointUpdatedAt}</dt>
                    <dd>{user.pointUpdatedAt ? formatDate(user.pointUpdatedAt) : copy.notUpdatedYet}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-state-card">
          <h2>{copy.emptyUsers}</h2>
        </section>
      )}
    </div>
  );
}
