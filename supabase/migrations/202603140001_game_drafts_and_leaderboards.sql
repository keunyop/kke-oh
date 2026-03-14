alter table games
  add column if not exists leaderboard_enabled boolean not null default false;

alter table games
  drop constraint if exists games_status_check;

alter table games
  add constraint games_status_check check (status in ('DRAFT', 'PUBLIC', 'REMOVED'));

create table if not exists game_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  player_name text not null,
  score int not null check (score > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_game_leaderboard_entries_game_score
  on game_leaderboard_entries (game_id, score desc, created_at asc);
