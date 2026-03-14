import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscoveryGames, sortDiscoveryGames } from './discovery';
import type { GameRecord } from './types';

function buildGame(partial: Partial<GameRecord> & Pick<GameRecord, 'id' | 'title' | 'created_at'>): GameRecord {
  return {
    id: partial.id,
    slug: partial.slug ?? partial.id,
    title: partial.title,
    description: partial.description ?? '',
    uploader_user_id: partial.uploader_user_id ?? null,
    uploader_name: partial.uploader_name ?? 'Maker',
    status: partial.status ?? 'PUBLIC',
    is_hidden: partial.is_hidden ?? false,
    hidden_reason: partial.hidden_reason ?? null,
    storage_prefix: partial.storage_prefix ?? partial.id,
    report_count: partial.report_count ?? 0,
    allowlist_violation: partial.allowlist_violation ?? false,
    leaderboard_enabled: partial.leaderboard_enabled ?? false,
    like_count: partial.like_count ?? 0,
    dislike_count: partial.dislike_count ?? 0,
    plays_7d: partial.plays_7d ?? 0,
    plays_30d: partial.plays_30d ?? 0,
    entry_path: partial.entry_path ?? 'index.html',
    thumbnail_path: partial.thumbnail_path ?? null,
    created_at: partial.created_at,
    updated_at: partial.updated_at ?? partial.created_at
  };
}

test('sortDiscoveryGames prefers strong play and reaction signals over recency alone', () => {
  const games = createDiscoveryGames([
    buildGame({
      id: 'fresh',
      title: 'Fresh',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      plays_7d: 2,
      plays_30d: 5,
      like_count: 1
    }),
    buildGame({
      id: 'popular',
      title: 'Popular',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      plays_7d: 60,
      plays_30d: 200,
      like_count: 20,
      dislike_count: 1
    })
  ]);

  const sorted = sortDiscoveryGames(games);
  assert.equal(sorted[0]?.id, 'popular');
});
