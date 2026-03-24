import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_PAGE_LEADERBOARD_LIMIT, getGamePageLeaderboardRows } from './leaderboard-display';

test('game page leaderboard rows are capped at 10 and use plain numeric rank labels', () => {
  const rows = getGamePageLeaderboardRows(
    Array.from({ length: 13 }, (_, index) => ({
      playerName: `Player ${index + 1}`,
      score: 1000 - index,
      createdAt: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`
    }))
  );

  assert.equal(rows.length, GAME_PAGE_LEADERBOARD_LIMIT);
  assert.equal(rows[0]?.rank, 1);
  assert.equal(rows[0]?.rankLabel, '1');
  assert.equal(rows[9]?.rank, 10);
  assert.equal(rows[9]?.rankLabel, '10');
  assert.ok(rows.every((row) => !row.rankLabel.includes('#')));
});
