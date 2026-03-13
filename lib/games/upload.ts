import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
import { ALLOWED_EXTENSIONS } from '@/lib/config';
import { createServiceClient } from '@/lib/db/supabase';
import { createPlaceholderThumbnail } from '@/lib/games/placeholder';
import type { GameRecord } from '@/lib/games/types';
import { uploadToR2 } from '@/lib/r2/client';
import { detectAllowlistViolation } from '@/lib/security/contentScan';

const MAX_ARCHIVE_BYTES = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 200;
const RESERVED_META_FILE = 'game.json';
const OPTIMIZED_THUMBNAIL_BASENAME = '__kkeoh_thumbnail';
const OPTIMIZED_THUMBNAIL_EXTENSION = '.webp';
const OPTIMIZED_THUMBNAIL_PATH = `${OPTIMIZED_THUMBNAIL_BASENAME}${OPTIMIZED_THUMBNAIL_EXTENSION}`;
const THUMBNAIL_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const THUMBNAIL_MAX_WIDTH = 1200;
const THUMBNAIL_MAX_HEIGHT = 825;
const THUMBNAIL_WEBP_QUALITY = 82;

export type UploadedFile = {
  path: string;
  content: Buffer;
  contentType: string;
};

export type ZipInspection = {
  files: UploadedFile[];
  htmlFiles: string[];
  allowlistViolation: boolean;
  entryPath: string;
  thumbnailCandidates: string[];
};

function isThumbnailExtension(extension: string): boolean {
  return THUMBNAIL_EXTENSIONS.has(extension);
}

function isOptimizedThumbnailPath(assetPath: string): boolean {
  return path.basename(assetPath).startsWith(OPTIMIZED_THUMBNAIL_BASENAME);
}

function getPreferredThumbnailPath(thumbnailCandidates: string[]): string | null {
  return (
    thumbnailCandidates.find((candidate) => isOptimizedThumbnailPath(candidate)) ??
    thumbnailCandidates.find((candidate) => /(^|\/)thumbnail\.(png|jpg|jpeg|webp|gif|svg)$/i.test(candidate)) ??
    thumbnailCandidates[0] ??
    null
  );
}

function getOptimizedThumbnailPath(files: UploadedFile[]): string {
  const usedPaths = new Set(files.map((file) => file.path));
  if (!usedPaths.has(OPTIMIZED_THUMBNAIL_PATH)) {
    return OPTIMIZED_THUMBNAIL_PATH;
  }

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${OPTIMIZED_THUMBNAIL_BASENAME}_${index}${OPTIMIZED_THUMBNAIL_EXTENSION}`;
    if (!usedPaths.has(candidate)) {
      return candidate;
    }
  }

  return `${OPTIMIZED_THUMBNAIL_BASENAME}_${crypto.randomUUID().slice(0, 8)}${OPTIMIZED_THUMBNAIL_EXTENSION}`;
}

async function optimizeThumbnail(file: UploadedFile, outputPath: string): Promise<UploadedFile> {
  try {
    const content = await sharp(file.content, { animated: false })
      .rotate()
      .resize({
        width: THUMBNAIL_MAX_WIDTH,
        height: THUMBNAIL_MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: THUMBNAIL_WEBP_QUALITY })
      .toBuffer();

    return {
      path: outputPath,
      content,
      contentType: 'image/webp'
    };
  } catch {
    throw new Error('Thumbnail must be a valid PNG, JPG, JPEG, or WEBP image.');
  }
}

export function detectContentType(assetPath: string): string {
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

export function createSingleHtmlInspection(html: string, thumbnail?: UploadedFile | null): ZipInspection {
  const files: UploadedFile[] = [
    {
      path: 'index.html',
      content: Buffer.from(html, 'utf8'),
      contentType: detectContentType('index.html')
    }
  ];
  const thumbnailCandidates: string[] = [];

  if (thumbnail) {
    files.push(thumbnail);
    thumbnailCandidates.push(thumbnail.path);
  }

  return {
    files,
    htmlFiles: ['index.html'],
    allowlistViolation: detectAllowlistViolation([html]),
    entryPath: 'index.html',
    thumbnailCandidates
  };
}

export async function createThumbnailUpload(file: File | null | undefined): Promise<UploadedFile | null> {
  if (!(file instanceof File) || !file.size) {
    return null;
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!isThumbnailExtension(ext)) {
    throw new Error('Thumbnail must be a PNG, JPG, JPEG, or WEBP file.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error('Thumbnail file is too large. Limit is 5 MB.');
  }

  return optimizeThumbnail(
    {
      path: `thumbnail${ext}`,
      content: buffer,
      contentType: detectContentType(`thumbnail${ext}`)
    },
    OPTIMIZED_THUMBNAIL_PATH
  );
}

export function ensureInspectionHasThumbnail(inspection: ZipInspection, title: string): ZipInspection {
  if (inspection.thumbnailCandidates.length > 0) {
    return inspection;
  }

  const placeholder = createPlaceholderThumbnail(title);

  return {
    ...inspection,
    files: [...inspection.files, placeholder],
    thumbnailCandidates: [placeholder.path]
  };
}

export async function normalizeInspectionThumbnail(inspection: ZipInspection): Promise<ZipInspection> {
  const preferredThumbnail = getPreferredThumbnailPath(inspection.thumbnailCandidates);
  if (!preferredThumbnail || isOptimizedThumbnailPath(preferredThumbnail)) {
    return inspection;
  }

  if (!isThumbnailExtension(path.extname(preferredThumbnail).toLowerCase())) {
    return inspection;
  }

  const sourceFile = inspection.files.find((file) => file.path === preferredThumbnail);
  if (!sourceFile) {
    throw new Error(`Thumbnail file is missing from the upload: ${preferredThumbnail}`);
  }

  const optimizedPath = getOptimizedThumbnailPath(inspection.files);
  const optimizedThumbnail = await optimizeThumbnail(sourceFile, optimizedPath);

  return {
    ...inspection,
    files: [...inspection.files.filter((file) => file.path !== optimizedPath), optimizedThumbnail],
    thumbnailCandidates: [optimizedThumbnail.path, ...inspection.thumbnailCandidates.filter((candidate) => candidate !== optimizedPath)]
  };
}

export async function prepareInspectionForPublishing(inspection: ZipInspection, title: string): Promise<ZipInspection> {
  return normalizeInspectionThumbnail(ensureInspectionHasThumbnail(inspection, title));
}

function normalizeZipPath(fileName: string): string | null {
  const normalized = fileName.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) {
    return null;
  }
  return parts.join('/');
}

export function slugifyGameTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function isGameTitleAvailable(storageDir: string | null, title: string): Promise<{ gameId: string; available: boolean }> {
  const gameId = slugifyGameTitle(title);
  if (!gameId) {
    return { gameId: '', available: false };
  }

  const exists = storageDir
    ? await gameIdExistsInFilesystem(storageDir, gameId)
    : await gameIdExistsInSupabase(gameId);

  return {
    gameId,
    available: !exists
  };
}

async function gameIdExistsInFilesystem(storageDir: string, gameId: string): Promise<boolean> {
  try {
    await fs.access(path.join(storageDir, gameId));
    return true;
  } catch {
    return false;
  }
}

async function gameIdExistsInSupabase(gameId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('games').select('id').eq('id', gameId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

export async function inspectZipUpload(file: File): Promise<ZipInspection> {
  if (!file.size) {
    throw new Error('ZIP file is empty.');
  }

  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new Error('ZIP file is too large. Limit is 15 MB.');
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (!entries.length) {
    throw new Error('ZIP file does not contain any files.');
  }

  if (entries.length > MAX_FILES) {
    throw new Error(`ZIP file contains too many files. Limit is ${MAX_FILES}.`);
  }

  const files: UploadedFile[] = [];
  const htmlContents: string[] = [];
  const htmlFiles: string[] = [];
  const thumbnailCandidates: string[] = [];

  for (const entry of entries) {
    const normalizedPath = normalizeZipPath(entry.name);
    if (!normalizedPath) {
      throw new Error(`Invalid file path in ZIP: ${entry.name}`);
    }

    if (normalizedPath === RESERVED_META_FILE) {
      continue;
    }

    const ext = path.extname(normalizedPath).toLowerCase().slice(1);
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type: ${normalizedPath}`);
    }

    const content = Buffer.from(await entry.async('uint8array'));
    if (content.length > MAX_FILE_BYTES) {
      throw new Error(`File is too large: ${normalizedPath}`);
    }

    files.push({
      path: normalizedPath,
      content,
      contentType: detectContentType(normalizedPath)
    });

    if (ext === 'html') {
      htmlFiles.push(normalizedPath);
      htmlContents.push(content.toString('utf8'));
    }

    if (isThumbnailExtension(`.${ext}`)) {
      thumbnailCandidates.push(normalizedPath);
    }
  }

  if (!htmlFiles.length) {
    throw new Error('ZIP file must include at least one HTML file.');
  }

  const entryPath = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0];

  return {
    files,
    htmlFiles,
    allowlistViolation: detectAllowlistViolation(htmlContents),
    entryPath,
    thumbnailCandidates
  };
}

export async function resolveGameIdFromTitle(storageDir: string | null, title: string): Promise<string> {
  const result = await isGameTitleAvailable(storageDir, title);
  if (!result.gameId) {
    throw new Error('Game name must include letters or numbers.');
  }

  if (!result.available) {
    throw new Error('That game name is already being used. Please choose a different game name.');
  }

  return result.gameId;
}

export async function allocateGameId(storageDir: string | null, title: string): Promise<string> {
  return resolveGameIdFromTitle(storageDir, title);
}

export async function writeUploadedGame(options: {
  storageDir: string;
  id: string;
  title: string;
  description: string;
  uploaderUserId?: string | null;
  uploaderName: string;
  inspection: ZipInspection;
}): Promise<void> {
  const gameDir = path.join(options.storageDir, options.id);
  await fs.mkdir(gameDir, { recursive: true });

  for (const file of options.inspection.files) {
    const targetPath = path.join(gameDir, file.path);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.content);
  }

  const now = new Date().toISOString();
  const preferredThumbnail = getPreferredThumbnailPath(options.inspection.thumbnailCandidates);

  const gameRecord = {
    id: options.id,
    title: options.title,
    description: options.description,
    uploader_user_id: options.uploaderUserId ?? null,
    uploader_name: options.uploaderName,
    status: 'PUBLIC' as const,
    is_hidden: false,
    hidden_reason: null,
    storage_prefix: options.id,
    report_count: 0,
    allowlist_violation: options.inspection.allowlistViolation,
    like_count: 0,
    dislike_count: 0,
    plays_7d: 0,
    plays_30d: 0,
    entry_path: options.inspection.entryPath,
    thumbnail_path: preferredThumbnail,
    created_at: now,
    updated_at: now
  };

  await fs.writeFile(
    path.join(gameDir, RESERVED_META_FILE),
    `${JSON.stringify(gameRecord, null, 2)}\n`,
    'utf8'
  );
}

export async function writeUploadedGameToSupabase(options: {
  id: string;
  title: string;
  description: string;
  uploaderUserId?: string | null;
  uploaderName: string;
  inspection: ZipInspection;
  uploaderEmailHash: string;
  uploaderIpHash: string;
}): Promise<void> {
  const storagePrefix = options.id;

  for (const file of options.inspection.files) {
    await uploadToR2(`${storagePrefix}/${file.path}`, file.content, file.contentType);
  }

  const preferredThumbnail = getPreferredThumbnailPath(options.inspection.thumbnailCandidates);

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('games').insert({
    id: options.id,
    title: options.title,
    description: options.description,
    uploader_user_id: options.uploaderUserId ?? null,
    uploader_name: options.uploaderName,
    status: 'PUBLIC',
    is_hidden: false,
    hidden_reason: null,
    storage_prefix: storagePrefix,
    entry_path: options.inspection.entryPath,
    thumbnail_url: preferredThumbnail,
    uploader_email_hash: options.uploaderEmailHash,
    uploader_ip_hash: options.uploaderIpHash,
    allowlist_violation: options.inspection.allowlistViolation,
    report_count: 0,
    plays_total: 0,
    plays_7d: 0,
    plays_30d: 0,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from('upload_events').insert({
    game_id: options.id,
    uploader_email_hash: options.uploaderEmailHash,
    uploader_ip_hash: options.uploaderIpHash,
    risk_score: options.inspection.allowlistViolation ? 50 : 0,
    action: 'ALLOW',
    created_at: now
  });
}

export async function updateUploadedGame(options: {
  storageDir: string;
  game: GameRecord;
  title: string;
  description: string;
  inspection?: ZipInspection | null;
  thumbnail?: UploadedFile | null;
}): Promise<void> {
  const gameDir = path.join(options.storageDir, options.game.id);
  await fs.mkdir(gameDir, { recursive: true });

  for (const file of options.inspection?.files ?? []) {
    const targetPath = path.join(gameDir, file.path);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.content);
  }

  if (options.thumbnail) {
    const targetPath = path.join(gameDir, options.thumbnail.path);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, options.thumbnail.content);
  }

  const nextThumbnailPath =
    options.thumbnail?.path ??
    (options.inspection ? getPreferredThumbnailPath(options.inspection.thumbnailCandidates) : null) ??
    options.game.thumbnail_path;

  const nextRecord = {
    ...options.game,
    title: options.title,
    description: options.description,
    allowlist_violation: options.inspection?.allowlistViolation ?? options.game.allowlist_violation,
    entry_path: options.inspection?.entryPath ?? options.game.entry_path,
    thumbnail_path: nextThumbnailPath,
    updated_at: new Date().toISOString()
  };

  await fs.writeFile(path.join(gameDir, RESERVED_META_FILE), `${JSON.stringify(nextRecord, null, 2)}\n`, 'utf8');
}

export async function updateUploadedGameInSupabase(options: {
  game: GameRecord;
  title: string;
  description: string;
  inspection?: ZipInspection | null;
  thumbnail?: UploadedFile | null;
}): Promise<void> {
  for (const file of options.inspection?.files ?? []) {
    await uploadToR2(`${options.game.id}/${file.path}`, file.content, file.contentType);
  }

  if (options.thumbnail) {
    await uploadToR2(`${options.game.id}/${options.thumbnail.path}`, options.thumbnail.content, options.thumbnail.contentType);
  }

  const thumbnailPath =
    options.thumbnail?.path ??
    (options.inspection ? getPreferredThumbnailPath(options.inspection.thumbnailCandidates) : null) ??
    options.game.thumbnail_path;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('games')
    .update({
      title: options.title,
      description: options.description,
      entry_path: options.inspection?.entryPath ?? options.game.entry_path,
      thumbnail_url: thumbnailPath,
      allowlist_violation: options.inspection?.allowlistViolation ?? options.game.allowlist_violation,
      updated_at: new Date().toISOString()
    })
    .eq('id', options.game.id);

  if (error) {
    throw new Error(error.message);
  }
}
