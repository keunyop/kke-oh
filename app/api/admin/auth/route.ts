import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Admin access is now granted through approved user accounts. Sign in as kylee1112@hotmail.com or jaden.'
    },
    { status: 410 }
  );
}
