alter table games
  add column if not exists like_count int not null default 0,
  add column if not exists dislike_count int not null default 0;

create table if not exists game_feedback (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_feedback_game_id on game_feedback (game_id, created_at desc);

create or replace function apply_game_reaction(
  p_game_id uuid,
  p_previous_reaction text,
  p_next_reaction text
)
returns void
language plpgsql
as $$
begin
  update games
  set
    like_count = greatest(
      0,
      like_count
      - case when p_previous_reaction = 'LIKE' and p_next_reaction <> 'LIKE' then 1 else 0 end
      + case when p_next_reaction = 'LIKE' and p_previous_reaction <> 'LIKE' then 1 else 0 end
    ),
    dislike_count = greatest(
      0,
      dislike_count
      - case when p_previous_reaction = 'DISLIKE' and p_next_reaction <> 'DISLIKE' then 1 else 0 end
      + case when p_next_reaction = 'DISLIKE' and p_previous_reaction <> 'DISLIKE' then 1 else 0 end
    ),
    updated_at = now()
  where id = p_game_id;
end;
$$;
