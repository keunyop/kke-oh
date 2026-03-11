import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { inspectZipUpload } from '@/lib/games/upload';
import { storeInspection } from '@/lib/security/uploadCache';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ZIP file is required.' }, { status: 400 });
    }

    const inspection = await inspectZipUpload(file);
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
    const message = error instanceof Error ? error.message : 'Failed to inspect the ZIP file.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
