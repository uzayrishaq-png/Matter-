# Matter Code Vault

A tiny, installable web app for storing Matter setup codes for your smart‑home
devices. Sign in with Google, scan a device's Matter QR, and your label + code
live in Supabase so the same list shows up on every browser you log in from
(iPhone Safari, desktop, etc.).

## Stack
- React + TypeScript + Vite + Tailwind
- Supabase (Postgres + Auth, Google OAuth provider)
- `html5-qrcode` for camera scanning, `qrcode` for re‑rendering stored QR data
- `vite-plugin-pwa` for the installable web app
- GitHub Actions → GitHub Pages for hosting

## One‑time setup

### 1. Supabase project

1. Create a project at <https://supabase.com>.
2. Open **SQL editor → New query**, paste `supabase/schema.sql`, and run it.
3. Project Settings → API: copy the **Project URL** and **anon public key**.

### 2. Google OAuth (for the "Continue with Google" button)

1. In Google Cloud Console, create an **OAuth 2.0 Client ID** (type: Web).
2. Add authorised redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase → **Authentication → Providers → Google**, enable the provider
   and paste in the Google client ID + secret.
4. In Supabase → **Authentication → URL Configuration** set:
   - Site URL: `https://<your-github-user>.github.io/Matter-/`
   - Additional redirect URLs: `http://localhost:5173/` (and any other dev URLs)

### 3. GitHub Pages

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. Repository **Settings → Secrets and variables → Actions**, add:
   - `VITE_SUPABASE_URL` – the project URL from step 1
   - `VITE_SUPABASE_ANON_KEY` – the anon public key from step 1
3. Push to `main` (or run the workflow manually) and the app deploys to
   `https://<your-github-user>.github.io/Matter-/`.

On your iPhone, open that URL in Safari → **Share → Add to Home Screen**.
Tap "Continue with Google" and you're in.

## Local development

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

QR scanning needs camera access, which browsers only grant on `localhost` or
HTTPS. `vite dev` serves on `http://localhost:5173/Matter-/`, which counts as
a secure context for `getUserMedia`.

## Useful scripts

| command            | what it does                                 |
|--------------------|----------------------------------------------|
| `npm run dev`      | Vite dev server                              |
| `npm run typecheck`| `tsc --noEmit` against the app + config     |
| `npm run build`    | Typecheck + production build into `dist/`   |
| `npm run preview`  | Serve the built bundle locally              |

## Replacing the placeholder icons

`public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and
`favicon.ico` are generated from `scripts/gen-icons.py` (a plain indigo "M").
Drop your own PNGs into `public/` with the same filenames whenever you want
nicer artwork — no code changes needed.
