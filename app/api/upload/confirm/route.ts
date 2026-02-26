import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Upload is disabled in filesystem MVP mode. Add games under data/games/<game-id>.' },
    { status: 410 }
  );
}
