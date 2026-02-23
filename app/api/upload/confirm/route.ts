import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase';
import { uploadToR2 } from '@/lib/r2/client';
import { sha256 } from '@/lib/security/hash';
import { getRequestIp } from '@/lib/security/ip';
import { consumeInspection } from '@/lib/security/uploadCache';

export async function POST(req: Request) {
  const form = await req.formData();
  const inspectId = String(form.get('inspectId') ?? '');
  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const entryPath = String(form.get('entryPath') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const thumbnail = form.get('thumbnail') as File | null;

  if (!inspectId || !title || !entryPath) {
    return NextResponse.json({ error: 'inspectId, title, and entryPath are required.' }, { status: 400 });
  }

  const inspection = consumeInspection(inspectId);
  if (!inspection) {
    return NextResponse.json({ error: 'Upload inspection has expired. Please inspect ZIP again.' }, { status: 400 });
  }

  if (!inspection.htmlFiles.includes(entryPath)) {
    return NextResponse.json({ error: 'Invalid entryPath selection.' }, { status: 400 });
  }

  const gameId = randomUUID();
  const storagePrefix = `games/${gameId}`;

  for (const file of inspection.files) {
    await uploadToR2(`${storagePrefix}/${file.path}`, file.content, file.contentType);
  }

  let thumbnailUrl: string | null = null;
  if (thumbnail && thumbnail.size > 0) {
    const ext = thumbnail.name.split('.').pop()?.toLowerCase();
    const allowed = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
    if (!ext || !allowed.has(ext)) {
      return NextResponse.json({ error: 'Invalid thumbnail extension.' }, { status: 400 });
    }
    const buffer = Buffer.from(await thumbnail.arrayBuffer());
    thumbnailUrl = await uploadToR2(`${storagePrefix}/thumbnail.${ext}`, buffer, thumbnail.type || 'image/*');
  }

  const ip = getRequestIp();
  const ipHash = sha256(ip);
  const emailHash = sha256(email || 'anonymous@example.com');

  const supabase = createServiceClient();
  const isHidden = inspection.allowlistViolation;

  await supabase.from('games').insert({
    id: gameId,
    title,
    description,
    status: 'PUBLIC',
    is_hidden: isHidden,
    hidden_reason: isHidden ? 'CDN allowlist violation' : null,
    storage_prefix: storagePrefix,
    entry_path: entryPath,
    thumbnail_url: thumbnailUrl,
    uploader_email_hash: emailHash,
    uploader_ip_hash: ipHash,
    allowlist_violation: inspection.allowlistViolation
  });

  await supabase.from('upload_events').insert({
    game_id: gameId,
    uploader_email_hash: emailHash,
    uploader_ip_hash: ipHash,
    risk_score: inspection.allowlistViolation ? 80 : 10,
    action: inspection.allowlistViolation ? 'AUTO_HIDDEN' : 'PUBLISHED'
  });

  return NextResponse.json({ gameId, published: true, isHidden });
}
