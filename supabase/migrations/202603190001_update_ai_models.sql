update ai_models
set active = false
where id not in ('gpt-4o-mini', 'gpt-5-mini', 'gpt-5.4-mini');

insert into ai_models (id, label, provider, model_name, point_cost_create, point_cost_edit, active, sort_order)
values
  ('gpt-4o-mini', 'Fast', 'openai', 'gpt-4o-mini', 12, 8, true, 1),
  ('gpt-5-mini', 'Balanced', 'openai', 'gpt-5-mini', 24, 16, true, 2),
  ('gpt-5.4-mini', 'Polished', 'openai', 'gpt-5.4-mini', 36, 24, true, 3)
on conflict (id) do update
set
  label = excluded.label,
  provider = excluded.provider,
  model_name = excluded.model_name,
  point_cost_create = excluded.point_cost_create,
  point_cost_edit = excluded.point_cost_edit,
  active = excluded.active,
  sort_order = excluded.sort_order;
