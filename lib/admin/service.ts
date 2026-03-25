import { randomUUID } from 'node:crypto';
import { createServiceClient } from '@/lib/db/supabase';
import { getUserPointBalance, grantUserPoints, spendUserPoints } from '@/lib/points/service';

export type AdminUserPointRecord = {
  userId: string;
  loginId: string;
  createdAt: string;
  pointBalance: number;
  pointUpdatedAt: string | null;
};

export type AdminPointBalanceChange =
  | { direction: 'none'; delta: 0 }
  | { direction: 'increase' | 'decrease'; delta: number };

type AppUserRow = {
  id: string;
  login_id: string;
  created_at: string;
};

type PointBalanceRow = {
  user_id: string;
  balance: number;
  updated_at: string;
};

function isMissingTableError(error: unknown, tableName: string) {
  return error instanceof Error && error.message.includes(tableName);
}

function isMissingRpcError(error: unknown, functionName: string) {
  return error instanceof Error && error.message.includes(functionName);
}

export function normalizeAdminPointBalanceInput(value: unknown): number {
  const parsed =
    typeof value === 'string' && value.trim().length > 0
      ? Number(value)
      : typeof value === 'number'
        ? value
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error('Target balance must be a whole number zero or greater.');
  }

  return parsed;
}

export function getAdminPointBalanceChange(currentBalance: number, targetBalance: number): AdminPointBalanceChange {
  const safeCurrentBalance = Math.max(0, Math.trunc(currentBalance));
  const safeTargetBalance = normalizeAdminPointBalanceInput(targetBalance);

  if (safeCurrentBalance === safeTargetBalance) {
    return { direction: 'none', delta: 0 };
  }

  if (safeTargetBalance > safeCurrentBalance) {
    return {
      direction: 'increase',
      delta: safeTargetBalance - safeCurrentBalance
    };
  }

  return {
    direction: 'decrease',
    delta: safeCurrentBalance - safeTargetBalance
  };
}

async function listPointBalanceRows(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, PointBalanceRow>();
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_point_balances')
      .select('user_id,balance,updated_at')
      .in('user_id', userIds);

    if (error) {
      throw new Error(error.message);
    }

    return new Map((data ?? []).map((row) => [row.user_id, row as PointBalanceRow]));
  } catch (error) {
    if (isMissingTableError(error, 'user_point_balances')) {
      return new Map<string, PointBalanceRow>();
    }

    throw error;
  }
}

export async function listAdminUsersWithPoints(limit = 200): Promise<AdminUserPointRecord[]> {
  const supabase = createServiceClient();
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const { data, error } = await supabase
    .from('app_users')
    .select('id,login_id,created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
  }

  const users = (data as AppUserRow[] | null) ?? [];
  const balanceMap = await listPointBalanceRows(users.map((user) => user.id));

  return users.map((user) => {
    const balanceRow = balanceMap.get(user.id);
    return {
      userId: user.id,
      loginId: user.login_id,
      createdAt: user.created_at,
      pointBalance: balanceRow?.balance ?? 0,
      pointUpdatedAt: balanceRow?.updated_at ?? null
    };
  });
}

export async function getAdminUserPointRecord(userId: string): Promise<AdminUserPointRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('app_users')
    .select('id,login_id,created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error('Supabase auth tables are missing. Apply the latest migration first.');
  }

  if (!data) {
    return null;
  }

  const balanceMap = await listPointBalanceRows([userId]);
  const balanceRow = balanceMap.get(userId);

  return {
    userId: data.id,
    loginId: data.login_id,
    createdAt: data.created_at,
    pointBalance: balanceRow?.balance ?? 0,
    pointUpdatedAt: balanceRow?.updated_at ?? null
  };
}

async function setUserPointBalanceByFallback(options: {
  adminUserId: string;
  userId: string;
  targetBalance: number;
  sourceId: string;
}) {
  const currentBalance = await getUserPointBalance(options.userId);
  const change = getAdminPointBalanceChange(currentBalance, options.targetBalance);

  if (change.direction === 'none') {
    return {
      balance: currentBalance,
      changed: false,
      delta: 0
    };
  }

  const metadata = {
    adminUserId: options.adminUserId,
    previousBalance: currentBalance,
    targetBalance: options.targetBalance
  };

  if (change.direction === 'increase') {
    const result = await grantUserPoints({
      userId: options.userId,
      delta: change.delta,
      type: 'earn',
      sourceType: 'admin_adjustment',
      sourceId: options.sourceId,
      metadata
    });

    return {
      balance: result.balance,
      changed: result.applied,
      delta: change.delta
    };
  }

  const result = await spendUserPoints({
    userId: options.userId,
    delta: change.delta,
    sourceType: 'admin_adjustment',
    sourceId: options.sourceId,
    metadata
  });

  return {
    balance: result.balance,
    changed: result.applied,
    delta: -change.delta
  };
}

export async function setUserPointBalanceByAdmin(options: {
  adminUserId: string;
  userId: string;
  targetBalance: number;
}) {
  const targetBalance = normalizeAdminPointBalanceInput(options.targetBalance);
  const sourceId = randomUUID();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('admin_set_user_point_balance', {
      p_admin_user_id: options.adminUserId,
      p_target_user_id: options.userId,
      p_target_balance: targetBalance,
      p_source_id: sourceId,
      p_metadata: {}
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      balance: Number(row?.balance ?? targetBalance),
      changed: Boolean(row?.applied),
      delta: Number(row?.delta ?? 0)
    };
  } catch (error) {
    if (isMissingRpcError(error, 'admin_set_user_point_balance')) {
      return setUserPointBalanceByFallback({
        adminUserId: options.adminUserId,
        userId: options.userId,
        targetBalance,
        sourceId
      });
    }

    throw error;
  }
}
