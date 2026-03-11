# kke-oh

KKE-OH is a kid-friendly HTML game playground. It can run in:

- `filesystem` mode for local-only storage
- `supabase` mode for shared game data + R2 assets + simple user login

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
AUTH_STORAGE_DIR=./data/auth
```

If `GAME_DATA_DRIVER` is not set, the app auto-selects:

- `supabase` when both `SUPABASE_URL` and `R2_ENDPOINT` are present
- `filesystem` otherwise

That means local development can point to the same Supabase/R2 stack as production if the env vars are present when the dev server starts.

## Game file layout

Uploaded games are saved into the same on-disk layout. You can also create one manually:

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
  "uploader_name": "kid-maker",
  "entry_path": "index.html"
}
```

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
   - Login: `http://localhost:3000/login`
   - Game: `http://localhost:3000/game/<game-id>`
   - Upload: `http://localhost:3000/submit`
   - Admin: `http://localhost:3000/admin`

## Upload flows

- Login/signup uses only `ID + password`
- Upload requires login
- Users can upload with:
  - direct HTML paste
  - ZIP upload
- Thumbnail image is optional in both flows
- Home shows thumbnail, title, play count, like/dislike count, and uploader name

## Supabase setup

Apply every SQL file under [supabase/migrations](/d:/10%20Development/10%20개인프로젝트/69.%20kke-oh/workspace/kke-oh/supabase/migrations) before using `supabase` mode.
