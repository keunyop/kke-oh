import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { isGameTitleAvailable } from '@/lib/games/upload';

const querySchema = z.object({
  title: z.string().trim().min(1).max(80)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      title: searchParams.get('title') ?? ''
    });

    const driver = getGameDataDriver();
    const storageDir = driver === 'filesystem' ? getGameStorageDir() : null;
    const result = await isGameTitleAvailable(storageDir, query.title);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Please enter a game name.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Could not check the game name.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
