import type { LeaderboardEntry } from './leaderboard';

export const GAME_PAGE_LEADERBOARD_LIMIT = 10;

export type GamePageLeaderboardRow = {
  rank: number;
  rankLabel: string;
  entry: LeaderboardEntry;
};

export function getGamePageLeaderboardRows(entries: LeaderboardEntry[], limit = GAME_PAGE_LEADERBOARD_LIMIT): GamePageLeaderboardRow[] {
  const safeLimit = Math.max(1, Math.min(50, limit));
  return entries.slice(0, safeLimit).map((entry, index) => ({
    rank: index + 1,
    rankLabel: String(index + 1),
    entry
  }));
}
