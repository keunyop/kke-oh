import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLeaderboardPlayerName, normalizeLeaderboardScore } from './leaderboard';

test('normalizeLeaderboardPlayerName trims spaces and falls back to Player', () => {
  assert.equal(normalizeLeaderboardPlayerName('  Sky   Kid  '), 'Sky Kid');
  assert.equal(normalizeLeaderboardPlayerName('   '), 'Player');
});

test('normalizeLeaderboardScore accepts positive whole numbers only', () => {
  assert.equal(normalizeLeaderboardScore(42.4), 42);
  assert.equal(normalizeLeaderboardScore('99'), 99);
  assert.equal(normalizeLeaderboardScore(0), null);
  assert.equal(normalizeLeaderboardScore(-5), null);
});
