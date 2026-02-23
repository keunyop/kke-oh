create extension if not exists "pgcrypto";

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null check (status in ('PUBLIC', 'REMOVED')),
  is_hidden boolean not null default false,
  hidden_reason text,
  storage_prefix text not null,
  entry_path text not null,
  thumbnail_url text,
  uploader_email_hash text not null,
  uploader_ip_hash text not null,
  allowlist_violation boolean not null default false,
  report_count int not null default 0,
  plays_total int not null default 0,
  plays_7d int not null default 0,
  plays_30d int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_reports (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  reason text not null,
  reporter_ip_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists upload_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid,
  uploader_email_hash text not null,
  uploader_ip_hash text not null,
  risk_score int not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists blocklist (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('EMAIL', 'IP')),
  value_hash_or_value text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_games_home_feed on games (status, is_hidden, report_count, allowlist_violation, created_at desc);
create index if not exists idx_upload_events_ip_created on upload_events (uploader_ip_hash, created_at desc);
create index if not exists idx_game_reports_game_id on game_reports (game_id, created_at desc);
create index if not exists idx_blocklist_value on blocklist (value_hash_or_value);

create or replace function increment_play_counters(p_game_id uuid, p_ip_hash text)
returns void
language plpgsql
as $$
begin
  update games
  set
    plays_total = plays_total + 1,
    plays_7d = plays_7d + 1,
    plays_30d = plays_30d + 1,
    updated_at = now()
  where id = p_game_id;
end;
$$;
