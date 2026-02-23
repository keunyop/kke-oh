import JSZip from 'jszip';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ALLOWED_EXTENSIONS } from '@/lib/config';
import { canUploadByIp, isBlocked } from '@/lib/db/games';
import { detectAllowlistViolation } from '@/lib/security/contentScan';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';
import { storeInspection } from '@/lib/security/uploadCache';
import { verifyTurnstile } from '@/lib/security/turnstile';

const MAX_SIZE = 50 * 1024 * 1024;

function getContentType(path: string): string {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'text/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.wasm')) return 'application/wasm';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.mp3')) return 'audio/mpeg';
  if (path.endsWith('.ogg')) return 'audio/ogg';
  if (path.endsWith('.wav')) return 'audio/wav';
  return 'application/octet-stream';
}

export async function POST(req: Request) {
  const form = await req.formData();
  const zipFile = form.get('zip') as File | null;
  const turnstileToken = String(form.get('turnstileToken') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const ip = getRequestIp();
  const ipHash = sha256(ip);
  const emailHash = sha256(email || 'anonymous@example.com');

  if (!zipFile) return NextResponse.json({ error: 'ZIP file is required.' }, { status: 400 });
  if (zipFile.size > MAX_SIZE) return NextResponse.json({ error: 'ZIP exceeds 50MB.' }, { status: 400 });

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: 'Turnstile validation failed.' }, { status: 400 });
  }

  if (await isBlocked(emailHash, ipHash)) {
    return NextResponse.json({ error: 'Uploader blocked.' }, { status: 403 });
  }

  const rateLimit = await canUploadByIp(ipHash);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
  }

  const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
  const zip = await JSZip.loadAsync(zipBuffer);
  const files: { path: string; content: Buffer; contentType: string }[] = [];
  const textForScan: string[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const normalizedPath = path.replace(/^\/+/, '');
    const ext = normalizedPath.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `Disallowed file extension for ${normalizedPath}` }, { status: 400 });
    }

    const content = Buffer.from(await entry.async('uint8array'));
    const contentType = getContentType(normalizedPath.toLowerCase());
    files.push({ path: normalizedPath, content, contentType });
    if (['html', 'js'].includes(ext)) {
      textForScan.push(content.toString('utf8'));
    }
  }

  const htmlFiles = files.map((f) => f.path).filter((p) => p.toLowerCase().endsWith('.html'));
  if (!htmlFiles.length) {
    return NextResponse.json({ error: 'ZIP must contain at least one HTML file.' }, { status: 400 });
  }

  const defaultEntryPath = htmlFiles.find((f) => f.toLowerCase().endsWith('index.html')) ?? htmlFiles[0];
  const allowlistViolation = detectAllowlistViolation(textForScan);
  const inspectId = randomUUID();
  storeInspection(inspectId, { files, htmlFiles, allowlistViolation, createdAt: Date.now() });

  return NextResponse.json({ inspectId, htmlFiles, defaultEntryPath, allowlistViolation });
}
