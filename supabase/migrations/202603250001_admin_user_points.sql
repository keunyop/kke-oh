create or replace function admin_set_user_point_balance(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_target_balance int,
  p_source_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(balance int, applied boolean, delta int)
language plpgsql
as $$
declare
  current_balance int;
  next_balance int;
  adjustment_delta int;
  entry_type text;
begin
  if p_target_balance < 0 then
    raise exception 'Target balance must be zero or greater.';
  end if;

  if exists (
    select 1
    from user_point_ledger
    where user_id = p_target_user_id
      and source_type = 'admin_adjustment'
      and source_id = p_source_id
  ) then
    select b.balance
      into current_balance
      from user_point_balances b
      where b.user_id = p_target_user_id;

    return query
    select coalesce(current_balance, 0), false, 0;
    return;
  end if;

  if not exists (
    select 1
    from app_users
    where id = p_target_user_id
  ) then
    raise exception 'Target user not found.';
  end if;

  insert into user_point_balances (user_id, balance, updated_at)
  values (p_target_user_id, 0, now())
  on conflict (user_id) do nothing;

  select b.balance
    into current_balance
    from user_point_balances b
    where b.user_id = p_target_user_id
    for update;

  next_balance := p_target_balance;
  adjustment_delta := next_balance - coalesce(current_balance, 0);

  if adjustment_delta = 0 then
    return query
    select next_balance, false, 0;
    return;
  end if;

  update user_point_balances
  set balance = next_balance,
      updated_at = now()
  where user_id = p_target_user_id;

  entry_type := case
    when adjustment_delta > 0 then 'earn'
    else 'spend'
  end;

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
    p_target_user_id,
    entry_type,
    adjustment_delta,
    next_balance,
    'admin_adjustment',
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'adminUserId', p_admin_user_id,
      'previousBalance', coalesce(current_balance, 0),
      'targetBalance', next_balance
    )
  );

  return query
  select next_balance, true, adjustment_delta;
end;
$$;
