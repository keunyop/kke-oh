import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { GameAssetStore, GameReaction, GameRepository, ReactionResult, ReportResult } from '@/lib/games/repository';
import type { GameRecord, StoredAsset } from '@/lib/games/types';

const META_FILE_NAME = 'game.json';
const FEEDBACK_FILE_NAME = 'feedback.jsonl';

function isSafeGameId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
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

function normalizeGameRecord(id: string, raw: unknown): GameRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const now = new Date().toISOString();
  const data = raw as Record<string, unknown>;
  const rawId = typeof data.id === 'string' && isSafeGameId(data.id) ? data.id : id;

  return {
    id: rawId,
    slug:
      typeof data.slug === 'string' && data.slug.trim()
        ? data.slug.toLowerCase()
        : rawId.toLowerCase(),
    title: typeof data.title === 'string' ? data.title : rawId,
    description: typeof data.description === 'string' ? data.description : '',
    uploader_user_id: typeof data.uploader_user_id === 'string' ? data.uploader_user_id : null,
    uploader_name: typeof data.uploader_name === 'string' && data.uploader_name.trim() ? data.uploader_name : 'Maker',
    status: data.status === 'REMOVED' ? 'REMOVED' : 'PUBLIC',
    is_hidden: Boolean(data.is_hidden),
    hidden_reason: typeof data.hidden_reason === 'string' ? data.hidden_reason : null,
    storage_prefix: typeof data.storage_prefix === 'string' ? data.storage_prefix : rawId,
    report_count: typeof data.report_count === 'number' ? data.report_count : 0,
    allowlist_violation: Boolean(data.allowlist_violation),
    like_count: typeof data.like_count === 'number' ? data.like_count : 0,
    dislike_count: typeof data.dislike_count === 'number' ? data.dislike_count : 0,
    plays_7d: typeof data.plays_7d === 'number' ? data.plays_7d : 0,
    plays_30d: typeof data.plays_30d === 'number' ? data.plays_30d : 0,
    entry_path: typeof data.entry_path === 'string' ? data.entry_path : 'index.html',
    thumbnail_path: typeof data.thumbnail_path === 'string' ? data.thumbnail_path : null,
    created_at: typeof data.created_at === 'string' ? data.created_at : now,
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : now
  };
}

async function pathExists(value: string): Promise<boolean> {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

class FilesystemGameStoreBase {
  constructor(private readonly storageDir: string) {}

  protected getStorageDir(): string {
    return this.storageDir;
  }

  protected resolveGameDir(id: string): string | null {
    if (!isSafeGameId(id)) return null;
    return path.join(this.storageDir, id);
  }

  protected async listGameIds(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.storageDir, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory() && isSafeGameId(entry.name)).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  protected async readGame(id: string): Promise<GameRecord | null> {
    const gameDir = this.resolveGameDir(id);
    if (!gameDir) return null;

    const filePath = path.join(gameDir, META_FILE_NAME);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return normalizeGameRecord(id, parsed);
    } catch {
      return null;
    }
  }

  protected async writeGame(record: GameRecord): Promise<void> {
    const gameDir = this.resolveGameDir(record.id);
    if (!gameDir) return;

    await fs.mkdir(gameDir, { recursive: true });
    const filePath = path.join(gameDir, META_FILE_NAME);
    await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  }

  protected async appendFeedback(id: string, message: string): Promise<boolean> {
    const gameDir = this.resolveGameDir(id);
    if (!gameDir) return false;

    await fs.mkdir(gameDir, { recursive: true });
    const filePath = path.join(gameDir, FEEDBACK_FILE_NAME);
    const entry = JSON.stringify({ message, created_at: new Date().toISOString() });
    await fs.appendFile(filePath, `${entry}\n`, 'utf8');
    return true;
  }
}

export class FilesystemGameRepository extends FilesystemGameStoreBase implements GameRepository {
  async listPublic(): Promise<GameRecord[]> {
    const games = await this.listForAdmin(1000);
    return games.filter(
      (game) =>
        game.status === 'PUBLIC' &&
        !game.is_hidden &&
        game.report_count < 2
    );
  }

  async listForAdmin(limit = 100): Promise<GameRecord[]> {
    const ids = await this.listGameIds();
    const records = await Promise.all(ids.map((id) => this.readGame(id)));

    return records
      .filter((record): record is GameRecord => Boolean(record))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, Math.max(1, limit));
  }

  async listByUser(userId: string): Promise<GameRecord[]> {
    const records = await this.listForAdmin(1000);
    return records.filter((record) => record.uploader_user_id === userId);
  }

  async getById(id: string): Promise<GameRecord | null> {
    return this.readGame(id);
  }

  async getBySlug(slug: string): Promise<GameRecord | null> {
    const normalizedSlug = slug.toLowerCase();
    const direct = await this.readGame(normalizedSlug);
    if (direct?.slug === normalizedSlug || direct?.id === normalizedSlug) {
      return direct;
    }

    const records = await this.listForAdmin(1000);
    return records.find((record) => record.slug.toLowerCase() === normalizedSlug) ?? null;
  }

  async incrementPlay(id: string): Promise<boolean> {
    const game = await this.readGame(id);
    if (!game || game.status !== 'PUBLIC') return false;

    game.plays_7d += 1;
    game.plays_30d += 1;
    game.updated_at = new Date().toISOString();
    await this.writeGame(game);
    return true;
  }

  async applyReaction(id: string, nextReaction: GameReaction, previousReaction?: GameReaction | null): Promise<ReactionResult | null> {
    const game = await this.readGame(id);
    if (!game || game.status !== 'PUBLIC') return null;

    if (previousReaction === nextReaction) {
      return {
        likeCount: game.like_count,
        dislikeCount: game.dislike_count,
        reaction: nextReaction
      };
    }

    if (previousReaction === 'LIKE' && game.like_count > 0) {
      game.like_count -= 1;
    }

    if (previousReaction === 'DISLIKE' && game.dislike_count > 0) {
      game.dislike_count -= 1;
    }

    if (nextReaction === 'LIKE') {
      game.like_count += 1;
    } else {
      game.dislike_count += 1;
    }

    game.updated_at = new Date().toISOString();
    await this.writeGame(game);

    return {
      likeCount: game.like_count,
      dislikeCount: game.dislike_count,
      reaction: nextReaction
    };
  }

  async addFeedback(id: string, message: string): Promise<boolean> {
    const game = await this.readGame(id);
    if (!game || game.status !== 'PUBLIC') return false;
    return this.appendFeedback(id, message);
  }

  async report(id: string, reason: string): Promise<ReportResult | null> {
    const game = await this.readGame(id);
    if (!game) return null;

    game.report_count += 1;
    game.is_hidden = game.report_count >= 2;
    game.hidden_reason = game.is_hidden ? `Auto-hidden due to reports: ${reason}` : null;
    game.updated_at = new Date().toISOString();
    await this.writeGame(game);

    return { reportCount: game.report_count, hidden: game.is_hidden };
  }

  async hide(id: string, reason: string): Promise<boolean> {
    const game = await this.readGame(id);
    if (!game) return false;

    game.is_hidden = true;
    game.hidden_reason = reason;
    game.updated_at = new Date().toISOString();
    await this.writeGame(game);
    return true;
  }

  async unhide(id: string): Promise<boolean> {
    const game = await this.readGame(id);
    if (!game) return false;

    game.is_hidden = false;
    game.hidden_reason = null;
    game.updated_at = new Date().toISOString();
    await this.writeGame(game);
    return true;
  }

  async remove(id: string, reason?: string): Promise<boolean> {
    const game = await this.readGame(id);
    if (!game) return false;

    game.status = 'REMOVED';
    game.is_hidden = true;
    game.hidden_reason = reason ?? 'Removed by admin';
    game.updated_at = new Date().toISOString();
    await this.writeGame(game);
    return true;
  }
}

export class FilesystemGameAssetStore extends FilesystemGameStoreBase implements GameAssetStore {
  async readAsset(id: string, assetPath: string): Promise<StoredAsset | null> {
    const gameDir = this.resolveGameDir(id);
    if (!gameDir) return null;

    const normalizedPath = normalizeAssetPath(assetPath);
    if (!normalizedPath) return null;

    const absoluteGameDir = path.resolve(gameDir);
    const absoluteAssetPath = path.resolve(absoluteGameDir, normalizedPath);
    if (!absoluteAssetPath.startsWith(`${absoluteGameDir}${path.sep}`) && absoluteAssetPath !== absoluteGameDir) {
      return null;
    }

    if (!(await pathExists(absoluteAssetPath))) return null;

    const content = await fs.readFile(absoluteAssetPath);
    return {
      content,
      contentType: detectContentType(normalizedPath)
    };
  }

  getAssetUrlPath(id: string, assetPath: string): string {
    if (!isSafeGameId(id)) return '#';
    const normalizedPath = normalizeAssetPath(assetPath);
    if (!normalizedPath) return '#';
    const encodedPath = normalizedPath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return `/api/games/${encodeURIComponent(id)}/assets/${encodedPath}`;
  }
}
