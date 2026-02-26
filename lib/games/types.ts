export type GameStatus = 'PUBLIC' | 'REMOVED';

export type GameRecord = {
  id: string;
  title: string;
  description: string;
  status: GameStatus;
  is_hidden: boolean;
  hidden_reason: string | null;
  report_count: number;
  allowlist_violation: boolean;
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
