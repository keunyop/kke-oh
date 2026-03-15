import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractBestLeaderboardScoreFromText,
  extractLeaderboardSubmissionScore,
  hasLeaderboardTerminalState,
  injectLeaderboardBridge,
  LEADERBOARD_MESSAGE_TYPE,
  normalizeLeaderboardSubmissionScore
} from './score-bridge';

test('normalizeLeaderboardSubmissionScore accepts only positive numbers', () => {
  assert.equal(normalizeLeaderboardSubmissionScore(14.6), 15);
  assert.equal(normalizeLeaderboardSubmissionScore('99'), 99);
  assert.equal(normalizeLeaderboardSubmissionScore(0), null);
  assert.equal(normalizeLeaderboardSubmissionScore('nope'), null);
});

test('extractLeaderboardSubmissionScore reads supported payload shapes', () => {
  assert.equal(extractLeaderboardSubmissionScore({ type: LEADERBOARD_MESSAGE_TYPE, score: 42 }), 42);
  assert.equal(extractLeaderboardSubmissionScore({ type: LEADERBOARD_MESSAGE_TYPE, finalScore: '84' }), 84);
  assert.equal(extractLeaderboardSubmissionScore({ type: LEADERBOARD_MESSAGE_TYPE, detail: { score: 126 } }), 126);
  assert.equal(extractLeaderboardSubmissionScore({ type: 'other-event', score: 42 }), null);
});

test('extractBestLeaderboardScoreFromText picks the largest visible score candidate', () => {
  const text = 'Score: 1200\nCoins 20\nFinal Score: 4,500\n점수 3200';

  assert.equal(extractBestLeaderboardScoreFromText(text), 4500);
  assert.equal(extractBestLeaderboardScoreFromText('no score here'), null);
});

test('hasLeaderboardTerminalState detects common ending phrases', () => {
  assert.equal(hasLeaderboardTerminalState('Game Over - tap restart'), true);
  assert.equal(hasLeaderboardTerminalState('승리! 다시하기'), true);
  assert.equal(hasLeaderboardTerminalState('Keep collecting stars'), false);
});

test('injectLeaderboardBridge appends a reliable score bridge and preserves body closing tag', () => {
  const html = '<html><body><main>Play</main></body></html>';
  const injected = injectLeaderboardBridge(html);

  assert.match(injected, /window\.kkeohSubmitScore = function \(score\)/);
  assert.match(injected, new RegExp(LEADERBOARD_MESSAGE_TYPE));
  assert.match(injected, /previousSubmit/);
  assert.match(injected, /<\/script>\n<\/body><\/html>$/);
});
