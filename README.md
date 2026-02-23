# kke-oh (께오)

Kid-friendly HTML game hosting platform built with **Next.js App Router + TypeScript**, **Supabase Postgres**, **Cloudflare R2**, and **Cloudflare Turnstile**.

## Features in V1

- Upload game as ZIP (max 50MB) with server-side extraction and entry file selection.
- Upload game by pasting HTML.
- Store game assets in Cloudflare R2 under `games/{gameId}/...`.
- Turnstile anti-spam verification.
- Upload rate limits by hashed IP:
  - 1 upload / 10 minutes
  - 3 uploads / day
- Hashes email and IP using SHA256 before persistence.
- CDN allowlist scanner over HTML/JS; violations auto-hide uploads.
- Homepage gate logic with popularity score:
  - `score = plays_7d + 0.2 * plays_30d`
- Sandboxed game player iframe and report button.
- Auto-hide when reports reach 2.
- Admin panel protected by `ADMIN_SECRET` header or secure cookie.

## Required Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=

TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

ADMIN_SECRET=

# Needed by UI/runtime
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Local Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Run Supabase migration (SQL in `supabase/migrations/202602230001_init.sql`) using Supabase SQL editor or CLI.
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open:
   - Home: `http://localhost:3000/`
   - Submit: `http://localhost:3000/submit`
   - Admin: `http://localhost:3000/admin`

## API Endpoints

- `POST /api/upload/zip-inspect`
- `POST /api/upload/confirm`
- `POST /api/upload/paste`
- `POST /api/games/:id/play`
- `POST /api/games/:id/report`
- `POST /api/admin/auth`
- `GET /api/admin/games`
- `POST /api/admin/games/:id/hide`
- `POST /api/admin/games/:id/unhide`
- `POST /api/admin/games/:id/delete`
- `POST /api/admin/blocklist`

## Deployment Notes

- Deploy Next.js app to Vercel (or Node host).
- Provide all env vars in deployment settings.
- Ensure R2 bucket has public-read policy for hosted game files.
- Point `NEXT_PUBLIC_APP_URL` to your deployed origin.
- Keep `ADMIN_SECRET` strong and rotate periodically.
- Prefer route-level firewall/rate-limiting at edge in addition to app-layer checks.

## Security Notes

- No Supabase Auth in V1. Admin control is secret-based only.
- Game pages use a sandboxed iframe and CSP to reduce external script/connect scope.
- External URLs in uploaded HTML/JS are scanned; non-allowlisted domains trigger auto-hide.

