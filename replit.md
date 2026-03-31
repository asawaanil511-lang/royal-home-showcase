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
- `src/pages/MyBets.tsx` — Bet history with VS team display, cancel fix (optimistic update), share win card with brand logo
- `src/pages/Rules.tsx` — Full rules page with all 14+ rules, special info box, legend, animations
- `src/pages/Leaderboard.tsx` — Computed leaderboard from bets + profiles (no view dependency)
- `src/pages/Results.tsx` — Improved match results with VS team layout
- `src/components/Navbar.tsx` — Navigation with icons per link, animated nav pill, improved mobile drawer with user card
- `src/components/HeroSection.tsx` — Animated logo with rotating ring, 4-stat grid, neon effects
- `src/components/GameZone.tsx` — 3-column layout (Matches, Leaderboard, Rules) with icon-based cards
- `src/components/Footer.tsx` — Footer with icon nav links, Telegram contact badge
- `src/components/StatsSection.tsx` — Fetches real stats from Supabase (winners, paid out, biggest win, win rate)
- `src/components/RecentWinners.tsx` — Ranked winner cards with profit display
- `src/components/MatchCard.tsx` — Premium team cards with letter fallback, improved odds badges
- `src/pages/Profile.tsx` — Profile page: avatar/username, dark/light toggle (ThemeContext), notifications with Chrome permission, change password (blocked for demo), logout
- `src/pages/Rules.tsx` — Premium revamped rules page: accordion sections (Payment, Fraud, Betting, Settlement), quick stats bar, collapsible categories
- `src/contexts/ThemeContext.tsx` — Dark/light theme toggle; applies `.light` class to `<html>`; persisted in localStorage
- `src/hooks/useNotifications.ts` — Supabase realtime listener: sends browser notifications on bet won/lost/cancelled
- `src/components/BottomNav.tsx` — Fixed mobile bottom nav: HOME, BETS (→ /matches), PASSBOOK, PROFILE (hidden on md+)
- `src/components/admin/` — Admin dashboard, match management, user management, bet tracking

## Features

### My Bets Cancel Bug Fix
- Optimistic UI update: bet immediately marked as "cancelled" in state before API call
- Prevents double-cancellation exploitation
- Shows "Bet is in inactive state" message when match is closed

### Rules Page (/rules)
- 14+ rules with color-coded icons (✅ allowed, ❌ not allowed, ⚠️ warning, 👍 note, ❤️ info)
- Special Info box about Telegram vs Online toss validity
- Legend, animations, hindi text support

### Share Win Card
- html2canvas capture of win card with brand logo
- Uses Web Share API on mobile, fallback download on desktop

## Database (Supabase)

Tables: `profiles`, `matches`, `bets`, `user_roles`, `coin_flips`

## Configuration (config.json)

All secrets and API keys are stored in `config.json` at the project root (not gitignored):

- `SUPABASE_SERVICE_ROLE_KEY` — Admin Supabase key (server-only)
- `VITE_SUPABASE_ANON_KEY` — Public Supabase anon key (frontend)
- `SUPABASE_DATABASE_URL` — Direct Supabase PostgreSQL connection URL
- `SUPABASE_ACCESS_TOKEN` — Supabase management token
- `SESSION_SECRET` — Express session secret

Server reads config.json via `readFileSync` at startup. Vite reads it at build time for `VITE_SUPABASE_ANON_KEY`.

## Dev Workflow

```
npm run dev
```

Runs Express server (port 3001) + Vite dev server (port 5000) concurrently. Vite proxies `/api/*` requests to port 3001.

## Deployment

**Build command**: `bash build.sh`  
**Run command**: `NODE_ENV=production node ./dist/index.cjs`

In production, Express serves the Vite-built frontend from `dist/` as static files and handles all `/api/*` routes.
