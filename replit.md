# Superman Toss Book

A cricket sports betting/gaming web app — Superman Toss Book.

## Architecture

- **Frontend**: React + Vite + Shadcn UI (port 5000 in dev)
- **Backend**: Express.js API server (port 3001 in dev, same port as frontend in production)
- **Database/Auth**: Supabase (`xzgccthebdjchdumgrvv.supabase.co`)

## Key Files

- `server/index.ts` — Express API server with `/api/login-by-username` and `/api/admin-create-user` routes; serves static frontend in production
- `src/integrations/supabase/client.ts` — Supabase client (uses `VITE_SUPABASE_ANON_KEY`)
- `src/contexts/AuthContext.tsx` — Auth state, profile management, realtime wallet updates
- `src/pages/Login.tsx` — Username-based login (resolves username → email via API)
- `src/components/Navbar.tsx` — Navigation with Superman Toss Book branding
- `src/components/admin/` — Admin dashboard, match management, user management, bet tracking

## Database (Supabase)

Tables: `profiles`, `matches`, `bets`, `user_roles`, `coin_flips`

## Secrets (Replit Secrets)

- `SUPABASE_SERVICE_ROLE_KEY` — Admin Supabase key (server-only, never exposed to frontend)
- `VITE_SUPABASE_ANON_KEY` — Public Supabase key (frontend)

## Env Vars (Replit shared)

- `VITE_SUPABASE_URL` — `https://xzgccthebdjchdumgrvv.supabase.co`
- `VITE_SUPABASE_PROJECT_ID` — `xzgccthebdjchdumgrvv`

## Dev Workflow

```
npm run dev
```

Runs Express server (port 3001) + Vite dev server (port 5000) concurrently. Vite proxies `/api/*` requests to port 3001.

## Deployment

**Build command**: `bash build.sh`  
**Run command**: `NODE_ENV=production node ./dist/index.cjs`

In production, Express serves the Vite-built frontend from `dist/` as static files and handles all `/api/*` routes.
