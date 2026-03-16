import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPointPurchaseOrder } from '@/lib/points/service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { packageId?: string };
    const packageId = body.packageId?.trim();
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required.' }, { status: 400 });
    }

    const result = await createPointPurchaseOrder(user.id, packageId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create the purchase order.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
