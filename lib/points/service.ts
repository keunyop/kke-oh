import { randomUUID } from 'node:crypto';
import { getOptionalEnv } from '@/lib/config';
import { createServiceClient } from '@/lib/db/supabase';

export type PointLedgerEntry = {
  id: string;
  type: 'earn' | 'spend' | 'refund';
  delta: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PointPackage = {
  id: string;
  name: string;
  points: number;
  priceCents: number;
  active: boolean;
};

export type PointPurchaseOrder = {
  id: string;
  packageId: string;
  status: 'PENDING' | 'APPROVED' | 'FAILED' | 'CANCELLED';
  points: number;
  priceCents: number;
  createdAt: string;
};

type PointMutationResult = {
  balance: number;
  applied: boolean;
};

const DEFAULT_POINT_PACKAGES: PointPackage[] = [
  { id: 'starter', name: 'Starter 120', points: 120, priceCents: 299, active: true },
  { id: 'maker', name: 'Maker 300', points: 300, priceCents: 599, active: true },
  { id: 'studio', name: 'Studio 700', points: 700, priceCents: 1199, active: true }
];

function parseNumberEnv(name: string, fallback: number) {
  const value = Number(getOptionalEnv(name));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function isMissingTableError(error: unknown, tableName: string) {
  return error instanceof Error && error.message.includes(tableName);
}

function isMissingRpcError(error: unknown, functionName: string) {
  return error instanceof Error && error.message.includes(functionName);
}

export function getPlayPointReward() {
  return parseNumberEnv('KKEOH_PLAY_POINT_REWARD', 2);
}

export function getRewardedAdPointReward() {
  return parseNumberEnv('KKEOH_REWARDED_AD_POINT_REWARD', 8);
}

export function isPointPurchaseAutoApproveEnabled() {
  return getOptionalEnv('POINT_PURCHASE_AUTO_APPROVE') === 'true';
}

export async function getUserPointBalance(userId: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_point_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.balance ?? 0;
  } catch (error) {
    if (isMissingTableError(error, 'user_point_balances')) {
      return 0;
    }

    throw error;
  }
}

export async function listUserPointLedger(userId: string, limit = 30): Promise<PointLedgerEntry[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_point_ledger')
      .select('id,type,delta,balance_after,source_type,source_id,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(limit, 100)));

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((entry) => ({
      id: entry.id,
      type: entry.type,
      delta: entry.delta,
      balanceAfter: entry.balance_after,
      sourceType: entry.source_type,
      sourceId: entry.source_id,
      metadata: (entry.metadata as Record<string, unknown> | null) ?? {},
      createdAt: entry.created_at
    }));
  } catch (error) {
    if (isMissingTableError(error, 'user_point_ledger')) {
      return [];
    }

    throw error;
  }
}

export async function listPointPackages(): Promise<PointPackage[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('point_packages')
      .select('id,name,points,price_cents,active')
      .eq('active', true)
      .order('points', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      return DEFAULT_POINT_PACKAGES;
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      points: item.points,
      priceCents: item.price_cents,
      active: item.active
    }));
  } catch (error) {
    if (isMissingTableError(error, 'point_packages')) {
      return DEFAULT_POINT_PACKAGES;
    }

    throw error;
  }
}

async function runPointMutation(
  rpcName: 'grant_user_points' | 'spend_user_points',
  options: {
    userId: string;
    delta: number;
    type: 'earn' | 'spend' | 'refund';
    sourceType: string;
    sourceId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<PointMutationResult> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(rpcName, {
      p_user_id: options.userId,
      p_delta: options.delta,
      p_type: options.type,
      p_source_type: options.sourceType,
      p_source_id: options.sourceId,
      p_metadata: options.metadata ?? {}
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      balance: Number(row?.balance ?? 0),
      applied: Boolean(row?.applied)
    };
  } catch (error) {
    if (isMissingRpcError(error, rpcName)) {
      throw new Error('Point tables are not ready yet. Apply the latest Supabase migration first.');
    }

    throw error;
  }
}

export async function grantUserPoints(options: {
  userId: string;
  delta: number;
  type?: 'earn' | 'refund';
  sourceType: string;
  sourceId: string;
  metadata?: Record<string, unknown>;
}) {
  return runPointMutation('grant_user_points', {
    userId: options.userId,
    delta: Math.max(1, Math.round(options.delta)),
    type: options.type ?? 'earn',
    sourceType: options.sourceType,
    sourceId: options.sourceId,
    metadata: options.metadata
  });
}

export async function spendUserPoints(options: {
  userId: string;
  delta: number;
  sourceType: string;
  sourceId: string;
  metadata?: Record<string, unknown>;
}) {
  return runPointMutation('spend_user_points', {
    userId: options.userId,
    delta: Math.max(1, Math.round(options.delta)),
    type: 'spend',
    sourceType: options.sourceType,
    sourceId: options.sourceId,
    metadata: options.metadata
  });
}

export async function createPointPurchaseOrder(userId: string, packageId: string) {
  const pointPackage =
    (await listPointPackages()).find((item) => item.id === packageId && item.active) ?? null;

  if (!pointPackage) {
    throw new Error('Point package not found.');
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const orderId = randomUUID();
  const providerOrderId = `sandbox_${orderId.slice(0, 8)}`;

  const { error } = await supabase.from('point_purchase_orders').insert({
    id: orderId,
    user_id: userId,
    package_id: pointPackage.id,
    points: pointPackage.points,
    price_cents: pointPackage.priceCents,
    status: 'PENDING',
    payment_provider: 'sandbox',
    provider_order_id: providerOrderId,
    created_at: now,
    updated_at: now
  });

  if (error) {
    if (isMissingTableError(new Error(error.message), 'point_purchase_orders')) {
      throw new Error('Point purchase tables are not ready yet. Apply the latest Supabase migration first.');
    }

    throw new Error(error.message);
  }

  const order: PointPurchaseOrder = {
    id: orderId,
    packageId: pointPackage.id,
    status: 'PENDING',
    points: pointPackage.points,
    priceCents: pointPackage.priceCents,
    createdAt: now
  };

  if (!isPointPurchaseAutoApproveEnabled()) {
    return { order, autoApproved: false };
  }

  await confirmPointPurchaseOrder(userId, orderId);
  return {
    order: {
      ...order,
      status: 'APPROVED'
    },
    autoApproved: true
  };
}

export async function confirmPointPurchaseOrder(userId: string, orderId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('point_purchase_orders')
    .select('id,user_id,package_id,points,price_cents,status')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Purchase order not found.');
  }

  if (data.status === 'APPROVED') {
    return getUserPointBalance(userId);
  }

  if (data.status !== 'PENDING') {
    throw new Error('This purchase order can no longer be approved.');
  }

  await grantUserPoints({
    userId,
    delta: data.points,
    sourceType: 'purchase',
    sourceId: data.id,
    metadata: {
      packageId: data.package_id,
      priceCents: data.price_cents
    }
  });

  const { error: updateError } = await supabase
    .from('point_purchase_orders')
    .update({
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return getUserPointBalance(userId);
}

export async function createRewardedAdEvent(userId: string, gameId: string) {
  const rewardPoints = getRewardedAdPointReward();
  const grantToken = randomUUID();
  const eventId = randomUUID();
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('rewarded_ad_events').insert({
    id: eventId,
    user_id: userId,
    game_id: gameId,
    status: 'PENDING',
    reward_points: rewardPoints,
    ad_provider: 'google-gpt',
    provider_event_id: grantToken,
    created_at: now
  });

  if (error) {
    if (isMissingTableError(new Error(error.message), 'rewarded_ad_events')) {
      throw new Error('Rewarded ad tables are not ready yet. Apply the latest Supabase migration first.');
    }

    throw new Error(error.message);
  }

  return {
    eventId,
    rewardPoints,
    grantToken
  };
}

export async function grantRewardedAdPoints(userId: string, eventId: string, grantToken: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('rewarded_ad_events')
    .select('id,user_id,status,reward_points,provider_event_id,game_id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Rewarded ad session not found.');
  }

  if (data.status === 'GRANTED') {
    return getUserPointBalance(userId);
  }

  if (data.status !== 'PENDING') {
    throw new Error('This rewarded ad session is no longer valid.');
  }

  if (data.provider_event_id !== grantToken) {
    throw new Error('Reward approval could not be verified.');
  }

  await grantUserPoints({
    userId,
    delta: data.reward_points,
    sourceType: 'rewarded_ad',
    sourceId: data.id,
    metadata: {
      gameId: data.game_id
    }
  });

  const { error: updateError } = await supabase
    .from('rewarded_ad_events')
    .update({
      status: 'GRANTED'
    })
    .eq('id', eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return getUserPointBalance(userId);
}
