import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { FilesystemGameAssetStore, FilesystemGameRepository } from '@/lib/games/providers/filesystem';
import { SupabaseGameAssetStore, SupabaseGameRepository } from '@/lib/games/providers/supabase';
import type { GameRecord, StoredAsset } from '@/lib/games/types';

export type ReportResult = {
  reportCount: number;
  hidden: boolean;
};

export type GameReaction = 'LIKE' | 'DISLIKE';

export type ReactionResult = {
  likeCount: number;
  dislikeCount: number;
  reaction: GameReaction;
};

export interface GameRepository {
  listPublic(): Promise<GameRecord[]>;
  listForAdmin(limit?: number): Promise<GameRecord[]>;
  getById(id: string): Promise<GameRecord | null>;
  incrementPlay(id: string): Promise<boolean>;
  applyReaction(id: string, nextReaction: GameReaction, previousReaction?: GameReaction | null): Promise<ReactionResult | null>;
  addFeedback(id: string, message: string): Promise<boolean>;
  report(id: string, reason: string): Promise<ReportResult | null>;
  hide(id: string, reason: string): Promise<boolean>;
  unhide(id: string): Promise<boolean>;
  remove(id: string): Promise<boolean>;
}

export interface GameAssetStore {
  readAsset(id: string, assetPath: string): Promise<StoredAsset | null>;
  getAssetUrlPath(id: string, assetPath: string): string;
}

let repository: GameRepository | null = null;
let assetStore: GameAssetStore | null = null;

function initialize() {
  if (repository && assetStore) return;

  const driver = getGameDataDriver();
  if (driver === 'supabase') {
    repository = new SupabaseGameRepository();
    assetStore = new SupabaseGameAssetStore();
    return;
  }

  if (driver !== 'filesystem') {
    throw new Error(`Unsupported GAME_DATA_DRIVER: ${driver}`);
  }

  const storageDir = getGameStorageDir();
  repository = new FilesystemGameRepository(storageDir);
  assetStore = new FilesystemGameAssetStore(storageDir);
}

export function getGameRepository(): GameRepository {
  initialize();
  return repository as GameRepository;
}

export function getGameAssetStore(): GameAssetStore {
  initialize();
  return assetStore as GameAssetStore;
}
