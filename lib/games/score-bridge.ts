export const LEADERBOARD_MESSAGE_TYPE = 'kkeoh:submit-score';
const SCORE_CANDIDATE_REGEX = /(?:final\s*score|score|points?|점수|최종점수)\s*[:=：-]?\s*([0-9][0-9,]{0,11})/gi;
const TERMINAL_STATE_REGEX =
  /\b(game over|you win|victory|defeat|mission complete|level complete|stage clear|game clear|restart|retry|play again)\b|게임 오버|게임오버|승리|패배|실패|클리어|다시하기/iu;

export function normalizeLeaderboardSubmissionScore(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const normalized = Math.round(numeric);
  if (normalized < 1) {
    return null;
  }

  return normalized;
}

export function extractLeaderboardSubmissionScore(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as {
    type?: unknown;
    score?: unknown;
    finalScore?: unknown;
    value?: unknown;
    detail?: { score?: unknown } | null;
  };

  if (data.type !== LEADERBOARD_MESSAGE_TYPE) {
    return null;
  }

  return (
    normalizeLeaderboardSubmissionScore(data.score) ??
    normalizeLeaderboardSubmissionScore(data.finalScore) ??
    normalizeLeaderboardSubmissionScore(data.value) ??
    normalizeLeaderboardSubmissionScore(data.detail?.score)
  );
}

export function extractBestLeaderboardScoreFromText(text: string): number | null {
  if (!text.trim()) {
    return null;
  }

  let bestScore: number | null = null;

  for (const match of text.matchAll(SCORE_CANDIDATE_REGEX)) {
    const score = normalizeLeaderboardSubmissionScore(match[1]?.replace(/,/g, ''));
    if (score != null && (bestScore == null || score > bestScore)) {
      bestScore = score;
    }
  }

  return bestScore;
}

export function hasLeaderboardTerminalState(text: string): boolean {
  return TERMINAL_STATE_REGEX.test(text);
}

export function injectLeaderboardBridge(html: string): string {
  if (html.includes(LEADERBOARD_MESSAGE_TYPE) || html.includes('window.kkeohSubmitScore = function')) {
    return html;
  }

  const bridge = `<script>
(function () {
  if (typeof window === 'undefined') return;
  var previousSubmit = typeof window.kkeohSubmitScore === 'function' ? window.kkeohSubmitScore : null;
  var lastSubmittedScore = null;
  var lastSubmittedAt = 0;

  function submitToParent(score) {
    var numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return false;
    var safeScore = Math.max(0, Math.round(numericScore));
    var now = Date.now();
    if (lastSubmittedScore === safeScore && now - lastSubmittedAt < 2000) {
      return false;
    }

    lastSubmittedScore = safeScore;
    lastSubmittedAt = now;

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: '${LEADERBOARD_MESSAGE_TYPE}', score: safeScore }, window.location.origin);
        return true;
      }
    } catch {}

    return false;
  }

  window.kkeohSubmitScore = function (score) {
    var submitted = submitToParent(score);

    if (previousSubmit) {
      try {
        previousSubmit.call(window, score);
      } catch {}
    }

    return submitted;
  };
})();
</script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${bridge}\n</body>`);
  }

  return `${html}\n${bridge}`;
}
