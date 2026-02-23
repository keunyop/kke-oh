import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { canUploadByIp, isBlocked } from '@/lib/db/games';
import { createServiceClient } from '@/lib/db/supabase';
import { detectAllowlistViolation } from '@/lib/security/contentScan';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { uploadToR2 } from '@/lib/r2/client';

export async function POST(req: Request) {
  const form = await req.formData();
  const html = String(form.get('html') ?? '');
  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const turnstileToken = String(form.get('turnstileToken') ?? '');
  const thumbnail = form.get('thumbnail') as File | null;

  const ip = getRequestIp();
  const ipHash = sha256(ip);
  const emailHash = sha256(email || 'anonymous@example.com');

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

  if (!title || !html) {
    return NextResponse.json({ error: 'Title and HTML content are required.' }, { status: 400 });
  }

  const allowlistViolation = detectAllowlistViolation([html]);
  const gameId = randomUUID();
  const storagePrefix = `games/${gameId}`;

  await uploadToR2(`${storagePrefix}/index.html`, Buffer.from(html, 'utf8'), 'text/html');

  let thumbnailUrl: string | null = null;
  if (thumbnail && thumbnail.size > 0) {
    const ext = thumbnail.name.split('.').pop()?.toLowerCase();
    const allowed = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
    if (!ext || !allowed.has(ext)) {
      return NextResponse.json({ error: 'Invalid thumbnail extension.' }, { status: 400 });
    }
    thumbnailUrl = await uploadToR2(
      `${storagePrefix}/thumbnail.${ext}`,
      Buffer.from(await thumbnail.arrayBuffer()),
      thumbnail.type || 'image/*'
    );
  }

  const supabase = createServiceClient();
  const isHidden = allowlistViolation;

  await supabase.from('games').insert({
    id: gameId,
    title,
    description,
    status: 'PUBLIC',
    is_hidden: isHidden,
    hidden_reason: isHidden ? 'CDN allowlist violation' : null,
    storage_prefix: storagePrefix,
    entry_path: 'index.html',
    thumbnail_url: thumbnailUrl,
    uploader_email_hash: emailHash,
    uploader_ip_hash: ipHash,
    allowlist_violation: allowlistViolation
  });

  await supabase.from('upload_events').insert({
    game_id: gameId,
    uploader_email_hash: emailHash,
    uploader_ip_hash: ipHash,
    risk_score: allowlistViolation ? 80 : 10,
    action: allowlistViolation ? 'AUTO_HIDDEN' : 'PUBLISHED'
  });

  return NextResponse.json({ gameId, published: true, isHidden });
}
