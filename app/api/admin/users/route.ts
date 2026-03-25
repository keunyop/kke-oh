import { NextResponse } from 'next/server';
import { listAdminUsersWithPoints } from '@/lib/admin/service';
import { isAdminAuthorized } from '@/lib/security/admin';

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await listAdminUsersWithPoints(200);
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load the admin user list.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
