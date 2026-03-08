import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { ALLOWED_EXTENSIONS } from '@/lib/config';
import { createServiceClient } from '@/lib/db/supabase';
import { uploadToR2 } from '@/lib/r2/client';
import { detectAllowlistViolation } from '@/lib/security/contentScan';

const MAX_ARCHIVE_BYTES = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 200;
const RESERVED_META_FILE = 'game.json';

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

function normalizeZipPath(fileName: string): string | null {
  const normalized = fileName.replace(/\\/g, '/').replace(/^\/+/, '');
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
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

    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
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

export async function allocateGameId(storageDir: string | null, title: string): Promise<string> {
  if (!storageDir) {
    return crypto.randomUUID();
  }

  const base = slugify(title) || `game-${crypto.randomUUID().slice(0, 8)}`;

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    try {
      await fs.access(path.join(storageDir, candidate));
    } catch {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function writeUploadedGame(options: {
  storageDir: string;
  id: string;
  title: string;
  description: string;
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
  const preferredThumbnail = options.inspection.thumbnailCandidates.find((candidate) =>
    /(^|\/)thumbnail\.(png|jpg|jpeg|webp|gif)$/i.test(candidate)
  );

  const gameRecord = {
    id: options.id,
    title: options.title,
    description: options.description,
    status: 'PUBLIC' as const,
    is_hidden: false,
    hidden_reason: null,
    storage_prefix: options.id,
    report_count: 0,
    allowlist_violation: options.inspection.allowlistViolation,
    plays_7d: 0,
    plays_30d: 0,
    entry_path: options.inspection.entryPath,
    thumbnail_path: preferredThumbnail ?? options.inspection.thumbnailCandidates[0] ?? null,
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
  inspection: ZipInspection;
  uploaderEmailHash: string;
  uploaderIpHash: string;
}): Promise<void> {
  const storagePrefix = options.id;

  for (const file of options.inspection.files) {
    await uploadToR2(`${storagePrefix}/${file.path}`, file.content, file.contentType);
  }

  const preferredThumbnail = options.inspection.thumbnailCandidates.find((candidate) =>
    /(^|\/)thumbnail\.(png|jpg|jpeg|webp|gif)$/i.test(candidate)
  );

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('games').insert({
    id: options.id,
    title: options.title,
    description: options.description,
    status: 'PUBLIC',
    is_hidden: false,
    hidden_reason: null,
    storage_prefix: storagePrefix,
    entry_path: options.inspection.entryPath,
    thumbnail_url: preferredThumbnail ?? options.inspection.thumbnailCandidates[0] ?? null,
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
