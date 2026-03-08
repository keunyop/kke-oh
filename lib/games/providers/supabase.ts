import path from 'node:path';
import { createServiceClient } from '@/lib/db/supabase';
import type { GameAssetStore, GameRepository, ReportResult } from '@/lib/games/repository';
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
  plays_7d: number;
  plays_30d: number;
  created_at: string;
  updated_at: string;
};

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
    plays_7d: row.plays_7d,
    plays_30d: row.plays_30d,
    entry_path: row.entry_path,
    thumbnail_path: row.thumbnail_url,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export class SupabaseGameRepository implements GameRepository {
  async listPublic(): Promise<GameRecord[]> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('games')
      .select('id,title,description,status,is_hidden,hidden_reason,storage_prefix,entry_path,thumbnail_url,allowlist_violation,report_count,plays_7d,plays_30d,created_at,updated_at')
      .eq('status', 'PUBLIC')
      .eq('is_hidden', false)
      .lt('report_count', 2)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRow(row as GameRow));
  }

  async listForAdmin(limit = 100): Promise<GameRecord[]> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('games')
      .select('id,title,description,status,is_hidden,hidden_reason,storage_prefix,entry_path,thumbnail_url,allowlist_violation,report_count,plays_7d,plays_30d,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, limit));

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRow(row as GameRow));
  }

  async getById(id: string): Promise<GameRecord | null> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('games')
      .select('id,title,description,status,is_hidden,hidden_reason,storage_prefix,entry_path,thumbnail_url,allowlist_violation,report_count,plays_7d,plays_30d,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as GameRow) : null;
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
