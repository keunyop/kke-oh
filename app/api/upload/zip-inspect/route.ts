import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createThumbnailUpload, inspectZipUpload } from '@/lib/games/upload';
import { storeInspection } from '@/lib/security/uploadCache';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인한 뒤에 게임을 올릴 수 있어요.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const thumbnail = formData.get('thumbnail');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ZIP file is required.' }, { status: 400 });
    }

    const inspection = await inspectZipUpload(file);
    const thumbnailFile = await createThumbnailUpload(thumbnail instanceof File ? thumbnail : null);
    if (thumbnailFile) {
      inspection.files.push(thumbnailFile);
      inspection.thumbnailCandidates.unshift(thumbnailFile.path);
    }
    const inspectionId = crypto.randomUUID();

    storeInspection(inspectionId, {
      ...inspection,
      createdAt: Date.now()
    });

    return NextResponse.json({
      inspectionId,
      entryPath: inspection.entryPath,
      htmlFiles: inspection.htmlFiles,
      thumbnailCandidates: inspection.thumbnailCandidates,
      allowlistViolation: inspection.allowlistViolation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to inspect ZIP file.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
