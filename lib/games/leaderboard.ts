import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { createServiceClient } from '@/lib/db/supabase';
import type { GameRecord } from '@/lib/games/types';

const MAX_PLAYER_NAME_LENGTH = 24;
const MAX_STORED_ENTRIES = 50;
const DEFAULT_LIST_LIMIT = 10;
const DUPLICATE_SCORE_WINDOW_MS = 15_000;
const LEADERBOARD_TABLE = 'game_leaderboard_entries';

export type LeaderboardEntry = {
  playerName: string;
  score: number;
  createdAt: string;
};

export type LeaderboardChampion = {
  gameId: string;
  slug: string;
  title: string;
  thumbnailPath: string | null;
  uploaderName: string;
  playerName: string;
  score: number;
  createdAt: string;
};

type StoredEntry = {
  player_name: string;
  score: number;
  created_at: string;
};

function getFallbackLeaderboardDir() {
  return path.join(path.dirname(getGameStorageDir()), 'leaderboards');
}

function normalizeStoredEntry(raw: unknown): LeaderboardEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const playerName = normalizeLeaderboardPlayerName(
    typeof data.player_name === 'string'
      ? data.player_name
      : typeof data.playerName === 'string'
        ? data.playerName
        : ''
  );
  const score = normalizeLeaderboardScore(data.score);
  const createdAt = typeof data.created_at === 'string' ? data.created_at : typeof data.createdAt === 'string' ? data.createdAt : '';

  if (!playerName || score == null || !createdAt) {
    return null;
  }

  return {
    playerName,
    score,
    createdAt
  };
}

function sortEntries(entries: LeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function isMissingLeaderboardTable(error: unknown) {
  return error instanceof Error && error.message.includes(LEADERBOARD_TABLE);
}

async function ensureFallbackDir() {
  await fs.mkdir(getFallbackLeaderboardDir(), { recursive: true });
}

async function readFallbackEntries(gameId: string): Promise<LeaderboardEntry[]> {
  try {
    const raw = await fs.readFile(path.join(getFallbackLeaderboardDir(), `${gameId}.json`), 'utf8');
    const parsed = JSON.parse(raw) as unknown[];
    return sortEntries(parsed.map((entry) => normalizeStoredEntry(entry)).filter((entry): entry is LeaderboardEntry => Boolean(entry)));
  } catch {
    return [];
  }
}

async function writeFallbackEntries(gameId: string, entries: LeaderboardEntry[]) {
  await ensureFallbackDir();
  const serialized: StoredEntry[] = entries.slice(0, MAX_STORED_ENTRIES).map((entry) => ({
    player_name: entry.playerName,
    score: entry.score,
    created_at: entry.createdAt
  }));
  await fs.writeFile(path.join(getFallbackLeaderboardDir(), `${gameId}.json`), `${JSON.stringify(serialized, null, 2)}\n`, 'utf8');
}

export function normalizeLeaderboardPlayerName(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return 'Player';
  }

  return trimmed.slice(0, MAX_PLAYER_NAME_LENGTH);
}

export function normalizeLeaderboardScore(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const score = Math.round(numeric);
  if (score < 1 || score > 999_999_999) {
    return null;
  }

  return score;
}

function hasRecentDuplicateScore(entries: LeaderboardEntry[], playerName: string, score: number, createdAt: string) {
  const createdTime = Date.parse(createdAt);
  if (!Number.isFinite(createdTime)) {
    return false;
  }

  return entries.some((entry) => {
    if (entry.playerName !== playerName || entry.score !== score) {
      return false;
    }

    const entryTime = Date.parse(entry.createdAt);
    if (!Number.isFinite(entryTime)) {
      return false;
    }

    return Math.abs(createdTime - entryTime) <= DUPLICATE_SCORE_WINDOW_MS;
  });
}

export async function listGameLeaderboard(gameId: string, limit = DEFAULT_LIST_LIMIT): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(50, limit));
  if (getGameDataDriver() !== 'supabase') {
    return readFallbackEntries(gameId).then((entries) => entries.slice(0, safeLimit));
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('player_name,score,created_at')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(safeLimit);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? [])
      .map((entry) => normalizeStoredEntry(entry))
      .filter((entry): entry is LeaderboardEntry => Boolean(entry));
  } catch (error) {
    if (!isMissingLeaderboardTable(error)) {
      throw error;
    }

    return readFallbackEntries(gameId).then((entries) => entries.slice(0, safeLimit));
  }
}

export async function submitGameLeaderboardScore(game: GameRecord, playerName: string, score: number): Promise<LeaderboardEntry[]> {
  if (!game.leaderboard_enabled) {
    throw new Error('Leaderboard is not enabled for this game.');
  }

  const normalizedPlayerName = normalizeLeaderboardPlayerName(playerName);
  const normalizedScore = normalizeLeaderboardScore(score);
  if (normalizedScore == null) {
    throw new Error('Score must be a whole number between 1 and 999999999.');
  }

  const entry: LeaderboardEntry = {
    playerName: normalizedPlayerName,
    score: normalizedScore,
    createdAt: new Date().toISOString()
  };

  const currentEntries = await listGameLeaderboard(game.id, MAX_STORED_ENTRIES);
  if (hasRecentDuplicateScore(currentEntries, entry.playerName, entry.score, entry.createdAt)) {
    return currentEntries.slice(0, DEFAULT_LIST_LIMIT);
  }

  if (getGameDataDriver() !== 'supabase') {
    await writeFallbackEntries(game.id, sortEntries([entry, ...currentEntries]));
    return listGameLeaderboard(game.id);
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from(LEADERBOARD_TABLE).insert({
      game_id: game.id,
      player_name: entry.playerName,
      score: entry.score,
      created_at: entry.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return listGameLeaderboard(game.id);
  } catch (error) {
    if (!isMissingLeaderboardTable(error)) {
      throw error;
    }

    await writeFallbackEntries(game.id, sortEntries([entry, ...currentEntries]));
    return listGameLeaderboard(game.id);
  }
}

export async function listLeaderboardChampions(games: GameRecord[], limit = 6): Promise<LeaderboardChampion[]> {
  const champions = await Promise.all(
    games
      .filter((game) => game.leaderboard_enabled)
      .map(async (game) => {
        const [entry] = await listGameLeaderboard(game.id, 1);
        if (!entry) {
          return null;
        }

        return {
          gameId: game.id,
          slug: game.slug,
          title: game.title,
          thumbnailPath: game.thumbnail_path,
          uploaderName: game.uploader_name,
          playerName: entry.playerName,
          score: entry.score,
          createdAt: entry.createdAt
        } satisfies LeaderboardChampion;
      })
  );

  return champions
    .filter((entry): entry is LeaderboardChampion => Boolean(entry))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.createdAt.localeCompare(right.createdAt);
    })
    .slice(0, Math.max(1, limit));
}

