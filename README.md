# kke-oh (MVP: Filesystem Mode)

This MVP serves games from local/server filesystem only.

- No database
- No object storage
- No public upload flow
- One developer-managed content pipeline

## Why this structure

The code now uses a storage abstraction (`GameRepository` / `GameAssetStore`) with a `filesystem` adapter.
When MVP is validated, you can add a new adapter (e.g. Supabase + R2) without rewriting pages/routes.

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Variables:

```env
ADMIN_SECRET=change-this-secret
GAME_DATA_DRIVER=filesystem
GAME_STORAGE_DIR=./data/games
```

## Game file layout

Create one folder per game:

```text
data/games/<game-id>/
  game.json
  index.html
  ...assets
```

Minimal `game.json`:

```json
{
  "id": "my-game",
  "title": "My Game",
  "description": "Short description",
  "entry_path": "index.html"
}
```

Optional fields are documented in `data/games/README.md`.

## Local setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Run dev server
   ```bash
   npm run dev
   ```
3. Open
   - Home: `http://localhost:3000/`
   - Game: `http://localhost:3000/game/<game-id>`
   - Admin: `http://localhost:3000/admin`

## Current MVP behavior

- Home lists public, non-hidden local games.
- Game assets are served by:
  - `GET /api/games/:id/assets/:path`
- Play/report counters are persisted into each game's `game.json`.
- Admin can hide/unhide/remove games (also via `game.json` updates).

## Notes for post-MVP expansion

Keep application logic against repository interfaces in `lib/games/repository.ts`.
Add a new provider under `lib/games/providers/` and switch wiring in the repository factory.
