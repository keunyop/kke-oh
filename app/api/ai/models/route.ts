import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listAiModels } from '@/lib/ai/models';
import { getUserPointBalance } from '@/lib/points/service';

export async function GET() {
  try {
    const [models, user] = await Promise.all([listAiModels(), getCurrentUser()]);
    const balance = user ? await getUserPointBalance(user.id) : 0;

    return NextResponse.json({
      models,
      balance
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load AI models.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

