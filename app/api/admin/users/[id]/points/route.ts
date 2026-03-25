import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminUserPointRecord, normalizeAdminPointBalanceInput, setUserPointBalanceByAdmin } from '@/lib/admin/service';
import { getAdminUser } from '@/lib/security/admin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getAdminUserPointRecord(params.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { targetBalance?: unknown };
    const targetBalance = normalizeAdminPointBalanceInput(body?.targetBalance);
    const result = await setUserPointBalanceByAdmin({
      adminUserId: adminUser.id,
      userId: user.userId,
      targetBalance
    });

    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      balance: result.balance,
      changed: result.changed,
      delta: result.delta,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update the user point balance.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
