import { NextResponse } from 'next/server';
import { listPointPackages } from '@/lib/points/service';

export async function GET() {
  try {
    const packages = await listPointPackages();
    return NextResponse.json({ packages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load point packages.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
