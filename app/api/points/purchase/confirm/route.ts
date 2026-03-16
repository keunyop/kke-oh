import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { confirmPointPurchaseOrder } from '@/lib/points/service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { orderId?: string };
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const balance = await confirmPointPurchaseOrder(user.id, orderId);
    return NextResponse.json({ ok: true, balance });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not confirm the purchase order.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
