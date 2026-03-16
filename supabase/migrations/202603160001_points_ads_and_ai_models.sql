create table if not exists ai_models (
  id text primary key,
  label text not null,
  provider text not null,
  model_name text not null,
  point_cost_create int not null check (point_cost_create > 0),
  point_cost_edit int not null check (point_cost_edit > 0),
  active boolean not null default true,
  sort_order int not null default 100
);

insert into ai_models (id, label, provider, model_name, point_cost_create, point_cost_edit, active, sort_order)
values
  ('gpt-4.1-mini', 'Fast', 'openai', 'gpt-4.1-mini', 12, 8, true, 1),
  ('gpt-4.1', 'Balanced', 'openai', 'gpt-4.1', 24, 16, true, 2),
  ('gpt-5-mini', 'Polished', 'openai', 'gpt-5-mini', 36, 24, true, 3)
on conflict (id) do update
set
  label = excluded.label,
  provider = excluded.provider,
  model_name = excluded.model_name,
  point_cost_create = excluded.point_cost_create,
  point_cost_edit = excluded.point_cost_edit,
  active = excluded.active,
  sort_order = excluded.sort_order;

create table if not exists user_point_balances (
  user_id uuid primary key references app_users (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists user_point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  type text not null check (type in ('earn', 'spend', 'refund')),
  delta int not null,
  balance_after int not null check (balance_after >= 0),
  source_type text not null,
  source_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create index if not exists idx_user_point_ledger_user_created
  on user_point_ledger (user_id, created_at desc);

create table if not exists point_packages (
  id text primary key,
  name text not null,
  points int not null check (points > 0),
  price_cents int not null check (price_cents > 0),
  active boolean not null default true
);

insert into point_packages (id, name, points, price_cents, active)
values
  ('starter', 'Starter 120', 120, 299, true),
  ('maker', 'Maker 300', 300, 599, true),
  ('studio', 'Studio 700', 700, 1199, true)
on conflict (id) do update
set
  name = excluded.name,
  points = excluded.points,
  price_cents = excluded.price_cents,
  active = excluded.active;

create table if not exists point_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  package_id text not null references point_packages (id),
  points int not null check (points > 0),
  price_cents int not null check (price_cents > 0),
  status text not null check (status in ('PENDING', 'APPROVED', 'FAILED', 'CANCELLED')),
  payment_provider text not null,
  provider_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_point_purchase_orders_user_created
  on point_purchase_orders (user_id, created_at desc);

create table if not exists rewarded_ad_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  game_id uuid not null references games (id) on delete cascade,
  status text not null check (status in ('PENDING', 'GRANTED', 'FAILED', 'UNSUPPORTED', 'EXPIRED')),
  reward_points int not null check (reward_points > 0),
  ad_provider text not null,
  provider_event_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_rewarded_ad_events_provider_event_id
  on rewarded_ad_events (provider_event_id);

create or replace function grant_user_points(
  p_user_id uuid,
  p_delta int,
  p_type text,
  p_source_type text,
  p_source_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(balance int, applied boolean)
language plpgsql
as $$
declare
  current_balance int;
  next_balance int;
begin
  if p_delta <= 0 then
    raise exception 'Point delta must be greater than zero.';
  end if;

  if exists (
    select 1
    from user_point_ledger
    where user_id = p_user_id
      and source_type = p_source_type
      and source_id = p_source_id
  ) then
    select b.balance
      into current_balance
      from user_point_balances b
      where b.user_id = p_user_id;

    return query
    select coalesce(current_balance, 0), false;
    return;
  end if;

  insert into user_point_balances (user_id, balance, updated_at)
  values (p_user_id, 0, now())
  on conflict (user_id) do nothing;

  select b.balance
    into current_balance
    from user_point_balances b
    where b.user_id = p_user_id
    for update;

  next_balance := coalesce(current_balance, 0) + p_delta;

  update user_point_balances
  set balance = next_balance,
      updated_at = now()
  where user_id = p_user_id;

  insert into user_point_ledger (
    user_id,
    type,
    delta,
    balance_after,
    source_type,
    source_id,
    metadata
  )
  values (
    p_user_id,
    p_type,
    p_delta,
    next_balance,
    p_source_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return query
  select next_balance, true;
end;
$$;

create or replace function spend_user_points(
  p_user_id uuid,
  p_delta int,
  p_type text,
  p_source_type text,
  p_source_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(balance int, applied boolean)
language plpgsql
as $$
declare
  current_balance int;
  next_balance int;
begin
  if p_delta <= 0 then
    raise exception 'Point delta must be greater than zero.';
  end if;

  if exists (
    select 1
    from user_point_ledger
    where user_id = p_user_id
      and source_type = p_source_type
      and source_id = p_source_id
  ) then
    select b.balance
      into current_balance
      from user_point_balances b
      where b.user_id = p_user_id;

    return query
    select coalesce(current_balance, 0), false;
    return;
  end if;

  insert into user_point_balances (user_id, balance, updated_at)
  values (p_user_id, 0, now())
  on conflict (user_id) do nothing;

  select b.balance
    into current_balance
    from user_point_balances b
    where b.user_id = p_user_id
    for update;

  if coalesce(current_balance, 0) < p_delta then
    raise exception 'Not enough points.';
  end if;

  next_balance := current_balance - p_delta;

  update user_point_balances
  set balance = next_balance,
      updated_at = now()
  where user_id = p_user_id;

  insert into user_point_ledger (
    user_id,
    type,
    delta,
    balance_after,
    source_type,
    source_id,
    metadata
  )
  values (
    p_user_id,
    p_type,
    -p_delta,
    next_balance,
    p_source_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return query
  select next_balance, true;
end;
$$;
