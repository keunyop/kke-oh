import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listUserPointLedger } from '@/lib/points/service';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') ?? '30');
    const entries = await listUserPointLedger(user.id, limit);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load the point history.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
