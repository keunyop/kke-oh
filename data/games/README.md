# Local Games Directory

Create one directory per game:

```text
data/games/<game-id>/
  game.json
  index.html
  ...assets
```

Required `game.json` fields:

```json
{
  "id": "my-game",
  "title": "My Game",
  "description": "Short description",
  "entry_path": "index.html"
}
```

Optional fields:

- `thumbnail_path` (e.g. `"thumb.png"`)
- `status` (`"PUBLIC"` or `"REMOVED"`)
- `is_hidden` (boolean)
- `hidden_reason` (string or null)
- `allowlist_violation` (boolean)
- `report_count` (number)
- `plays_7d` (number)
- `plays_30d` (number)
- `created_at` (ISO string)
- `updated_at` (ISO string)
