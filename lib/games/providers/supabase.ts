import path from 'node:path';
import { createServiceClient } from '@/lib/db/supabase';
import type { GameAssetStore, GameReaction, GameRepository, ReactionResult, ReportResult } from '@/lib/games/repository';
import type { GameRecord, StoredAsset } from '@/lib/games/types';
import { readFromR2 } from '@/lib/r2/client';

type GameRow = {
  id: string;
  title: string;
  description: string | null;
  status: 'PUBLIC' | 'REMOVED';
  is_hidden: boolean;
  hidden_reason: string | null;
  storage_prefix: string;
  entry_path: string;
  thumbnail_url: string | null;
  allowlist_violation: boolean;
  report_count: number;
  like_count?: number | null;
  dislike_count?: number | null;
  plays_7d: number;
  plays_30d: number;
  created_at: string;
  updated_at: string;
};

const BASE_GAME_SELECT =
  'id,title,description,status,is_hidden,hidden_reason,storage_prefix,entry_path,thumbnail_url,allowlist_violation,report_count,plays_7d,plays_30d,created_at,updated_at';
const REACTION_GAME_SELECT = `${BASE_GAME_SELECT},like_count,dislike_count`;

function isMissingReactionColumns(errorMessage: string): boolean {
  return errorMessage.includes('like_count') || errorMessage.includes('dislike_count');
}

function normalizeAssetPath(value: string): string | null {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return null;
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) {
    return null;
  }
  return parts.join('/');
}

function detectContentType(assetPath: string): string {
  const ext = path.extname(assetPath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.wasm') return 'application/wasm';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.ogg') return 'audio/ogg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

function mapRow(row: GameRow): GameRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    is_hidden: row.is_hidden,
    hidden_reason: row.hidden_reason,
    storage_prefix: row.storage_prefix,
    report_count: row.report_count,
    allowlist_violation: row.allowlist_violation,
    like_count: row.like_count ?? 0,
    dislike_count: row.dislike_count ?? 0,
    plays_7d: row.plays_7d,
    plays_30d: row.plays_30d,
    entry_path: row.entry_path,
    thumbnail_path: row.thumbnail_url,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export class SupabaseGameRepository implements GameRepository {
  private async selectGames<T>(
    buildQuery: (selectClause: string) => Promise<{ data: unknown; error: { message: string } | null }>
  ): Promise<T[]> {
    const reactionResult = await buildQuery(REACTION_GAME_SELECT);
    if (!reactionResult.error) {
      return (reactionResult.data as T[] | null) ?? [];
    }

    if (!isMissingReactionColumns(reactionResult.error.message)) {
      throw new Error(reactionResult.error.message);
    }

    const fallbackResult = await buildQuery(BASE_GAME_SELECT);
    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return (fallbackResult.data as T[] | null) ?? [];
  }

  private async selectSingleGame<T>(
    buildQuery: (selectClause: string) => Promise<{ data: unknown; error: { message: string } | null }>
  ): Promise<T | null> {
    const reactionResult = await buildQuery(REACTION_GAME_SELECT);
    if (!reactionResult.error) {
      return (reactionResult.data as T | null) ?? null;
    }

    if (!isMissingReactionColumns(reactionResult.error.message)) {
      throw new Error(reactionResult.error.message);
    }

    const fallbackResult = await buildQuery(BASE_GAME_SELECT);
    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return (fallbackResult.data as T | null) ?? null;
  }

  async listPublic(): Promise<GameRecord[]> {
    const supabase = createServiceClient();
    const data = await this.selectGames<GameRow>(async (selectClause) =>
      await supabase
        .from('games')
        .select(selectClause)
        .eq('status', 'PUBLIC')
        .eq('is_hidden', false)
        .lt('report_count', 2)
        .order('created_at', { ascending: false })
    );

    return data.map((row) => mapRow(row));
  }

  async listForAdmin(limit = 100): Promise<GameRecord[]> {
    const supabase = createServiceClient();
    const data = await this.selectGames<GameRow>(async (selectClause) =>
      await supabase
        .from('games')
        .select(selectClause)
        .order('created_at', { ascending: false })
        .limit(Math.max(1, limit))
    );

    return data.map((row) => mapRow(row));
  }

  async getById(id: string): Promise<GameRecord | null> {
    const supabase = createServiceClient();
    const data = await this.selectSingleGame<GameRow>(async (selectClause) =>
      await supabase
        .from('games')
        .select(selectClause)
        .eq('id', id)
        .maybeSingle()
    );

    return data ? mapRow(data) : null;
  }

  async incrementPlay(id: string): Promise<boolean> {
    const game = await this.getById(id);
    if (!game || game.status !== 'PUBLIC') return false;

    const supabase = createServiceClient();
    const { error } = await supabase.rpc('increment_play_counters', {
      p_game_id: id,
      p_ip_hash: ''
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  async applyReaction(id: string, nextReaction: GameReaction, previousReaction?: GameReaction | null): Promise<ReactionResult | null> {
    const game = await this.getById(id);
    if (!game || game.status !== 'PUBLIC') return null;

    let likeCount = game.like_count;
    let dislikeCount = game.dislike_count;

    if (previousReaction === 'LIKE' && previousReaction !== nextReaction) {
      likeCount = Math.max(0, likeCount - 1);
    }

    if (previousReaction === 'DISLIKE' && previousReaction !== nextReaction) {
      dislikeCount = Math.max(0, dislikeCount - 1);
    }

    if (previousReaction !== nextReaction) {
      if (nextReaction === 'LIKE') {
        likeCount += 1;
      } else {
        dislikeCount += 1;
      }
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('games')
      .update({
        like_count: likeCount,
        dislike_count: dislikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      if (isMissingReactionColumns(error.message)) {
        throw new Error('Game reactions are not available until the latest Supabase migration is applied.');
      }
      throw new Error(error.message);
    }

    return {
      likeCount,
      dislikeCount,
      reaction: nextReaction
    };
  }

  async addFeedback(id: string, message: string): Promise<boolean> {
    const game = await this.getById(id);
    if (!game || game.status !== 'PUBLIC') return false;

    const supabase = createServiceClient();
    const { error } = await supabase.from('game_feedback').insert({
      game_id: id,
      message
    });

    if (error) {
      if (error.message.includes('game_feedback')) {
        throw new Error('Game feedback is not available until the latest Supabase migration is applied.');
      }
      throw new Error(error.message);
    }

    return true;
  }

  async report(id: string, reason: string): Promise<ReportResult | null> {
    const game = await this.getById(id);
    if (!game) return null;

    const reportCount = game.report_count + 1;
    const hidden = reportCount >= 2;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('games')
      .update({
        report_count: reportCount,
        is_hidden: hidden,
        hidden_reason: hidden ? `Auto-hidden due to reports: ${reason}` : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase.from('game_reports').insert({
      game_id: id,
      reason,
      reporter_ip_hash: ''
    });

    return { reportCount, hidden };
  }

  async hide(id: string, reason: string): Promise<boolean> {
    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from('games')
      .update({
        is_hidden: true,
        hidden_reason: reason,
        updated_at: new Date().toISOString()
      }, { count: 'exact' })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }

  async unhide(id: string): Promise<boolean> {
    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from('games')
      .update({
        is_hidden: false,
        hidden_reason: null,
        updated_at: new Date().toISOString()
      }, { count: 'exact' })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }

  async remove(id: string): Promise<boolean> {
    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from('games')
      .update({
        status: 'REMOVED',
        is_hidden: true,
        hidden_reason: 'Removed by admin',
        updated_at: new Date().toISOString()
      }, { count: 'exact' })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }
}

export class SupabaseGameAssetStore implements GameAssetStore {
  async readAsset(id: string, assetPath: string): Promise<StoredAsset | null> {
    const normalizedPath = normalizeAssetPath(assetPath);
    if (!normalizedPath) return null;

    const content = await readFromR2(`${id}/${normalizedPath}`);
    if (!content) return null;

    return {
      content,
      contentType: detectContentType(normalizedPath)
    };
  }

  getAssetUrlPath(id: string, assetPath: string): string {
    const normalizedPath = normalizeAssetPath(assetPath);
    if (!normalizedPath) return '#';
    const encodedPath = normalizedPath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return `/api/games/${encodeURIComponent(id)}/assets/${encodedPath}`;
  }
}
