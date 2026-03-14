alter table games
  add column if not exists slug text;

do $$
declare
  rec record;
  base_slug text;
  candidate text;
  counter int;
begin
  for rec in
    select id, title, storage_prefix
    from games
    order by created_at, id
  loop
    base_slug := lower(coalesce(rec.storage_prefix, ''));

    if base_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      base_slug := regexp_replace(lower(coalesce(rec.title, '')), '[^a-z0-9]+', '-', 'g');
      base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
    end if;

    if base_slug = '' then
      base_slug := 'game-' || substr(replace(rec.id::text, '-', ''), 1, 8);
    end if;

    candidate := left(base_slug, 64);
    counter := 2;

    while exists (select 1 from games where slug = candidate and id <> rec.id) loop
      candidate := regexp_replace(left(base_slug, greatest(1, 64 - length(counter::text) - 1)), '-+$', '');
      candidate := candidate || '-' || counter::text;
      counter := counter + 1;
    end loop;

    update games
    set slug = candidate
    where id = rec.id;
  end loop;
end;
$$;

alter table games
  alter column slug set not null;

create unique index if not exists idx_games_slug on games (slug);
