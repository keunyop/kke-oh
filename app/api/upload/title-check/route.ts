import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { isGameSlugAvailable } from '@/lib/games/upload';

const querySchema = z.object({
  slug: z.string().trim().min(1).max(80)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      slug: searchParams.get('slug') ?? ''
    });

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const result = await isGameSlugAvailable(storageDir, query.slug);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Please enter a URL game name.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Could not check the URL game name.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
