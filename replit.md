# Superman Toss Book

A cricket sports betting/gaming web app rebranded from "Lawrence Toss Book" to "Superman Toss Book".

## Architecture

- **Frontend**: React + Vite + Shadcn UI (port 5000 in dev)
- **Backend**: Express.js API server (port 3001 in dev, same port as frontend in production)
- **Database/Auth**: Supabase (`xzgccthebdjchdumgrvv.supabase.co`)

## Key Files

- `server/index.ts` — Express API server with `/api/login-by-username` and `/api/admin-create-user` routes; serves static frontend in production
- `src/integrations/supabase/client.ts` — Supabase client (uses `VITE_SUPABASE_ANON_KEY`)
- `src/contexts/AuthContext.tsx` — Auth state, profile management
- `src/pages/Login.tsx` — Username-based login (resolves username → email via API)
- `src/components/Navbar.tsx` — Navigation with Superman Toss Book branding
- `src/components/Footer.tsx` — Footer with Superman Toss Book branding
- `src/assets/superman-logo.jpg` — Superman Toss Book logo

## Database (Supabase)

Tables: `profiles`, `matches`, `bets`, `user_roles`, `coin_flips`
Views: `leaderboard`

## Admin User Credentials

- **Username**: `admin`
- **Password**: `Abcd@1234`
- **Role**: admin

## Deployment

**Build command**: `npm run build && npx esbuild server/index.ts --bundle --platform=node --format=cjs --outfile=dist/index.cjs --external:fsevents`

**Run command**: `NODE_ENV=production node ./dist/index.cjs`

In production, Express serves the Vite-built frontend from `dist/` as static files, plus handles all `/api/*` routes.

## Dev Workflow

```
npx concurrently "npx tsx server/index.ts" "npx vite"
```

## Secrets Required

- `SUPABASE_SERVICE_ROLE_KEY` — Admin Supabase key (server-only)
- `VITE_SUPABASE_ANON_KEY` — Public Supabase key (frontend)
- `VITE_SUPABASE_URL` — `https://xzgccthebdjchdumgrvv.supabase.co`
- `VITE_SUPABASE_PROJECT_ID` — `xzgccthebdjchdumgrvv`
