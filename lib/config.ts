import path from 'node:path';

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getGameDataDriver(): string {
  return getOptionalEnv('GAME_DATA_DRIVER') ?? (process.env.SUPABASE_URL && process.env.R2_ENDPOINT ? 'supabase' : 'filesystem');
}

export function getGameStorageDir(): string {
  return getOptionalEnv('GAME_STORAGE_DIR') ?? path.join(process.cwd(), 'data', 'games');
}

export function getAuthStorageDir(): string {
  return getOptionalEnv('AUTH_STORAGE_DIR') ?? path.join(process.cwd(), 'data', 'auth');
}

export function getGameMetricsDir(): string {
  return getOptionalEnv('GAME_METRICS_DIR') ?? path.join(process.cwd(), 'data', 'game-metrics');
}

export const ALLOWED_EXTENSIONS = new Set([
  'html',
  'css',
  'js',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'mp3',
  'ogg',
  'wav',
  'json',
  'txt',
  'wasm'
]);

export const CDN_ALLOWLIST = new Set([
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);
