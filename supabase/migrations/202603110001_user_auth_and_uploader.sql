create table if not exists app_users (
  id uuid primary key,
  login_id text not null,
  normalized_login_id text not null,
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_app_users_normalized_login_id on app_users (normalized_login_id);
create unique index if not exists idx_app_users_login_id on app_users (login_id);

create table if not exists app_sessions (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  session_token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create unique index if not exists idx_app_sessions_token_hash on app_sessions (session_token_hash);
create index if not exists idx_app_sessions_expires_at on app_sessions (expires_at);

alter table games
  add column if not exists uploader_user_id uuid references app_users(id) on delete set null,
  add column if not exists uploader_name text;

update games
set uploader_name = coalesce(nullif(uploader_name, ''), '친구')
where uploader_name is null or uploader_name = '';
