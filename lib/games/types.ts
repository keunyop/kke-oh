export type GameStatus = 'PUBLIC' | 'REMOVED';

export type GameRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  uploader_user_id: string | null;
  uploader_name: string;
  status: GameStatus;
  is_hidden: boolean;
  hidden_reason: string | null;
  storage_prefix: string;
  report_count: number;
  allowlist_violation: boolean;
  like_count: number;
  dislike_count: number;
  plays_7d: number;
  plays_30d: number;
  entry_path: string;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
};

export type StoredAsset = {
  content: Buffer;
  contentType: string;
};
