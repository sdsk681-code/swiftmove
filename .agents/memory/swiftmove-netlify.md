---
name: SwiftMove Netlify Deployment
description: How the swiftmove visitor site is deployed on Netlify and how the tRPC API is wired.
---

## Netlify setup
- GitHub repo: `sdsk681-code/swiftmove` (monorepo)
- Build command: `pnpm install && pnpm --filter @workspace/swiftmove run build`
- Publish dir: `artifacts/swiftmove/dist/public`
- Functions dir: `netlify/functions` (esbuild bundler)

## tRPC serverless function
- File: `netlify/functions/trpc.mts`
- Uses `@trpc/server/adapters/fetch` (fetchRequestHandler)
- Imports `appRouter` from `../../artifacts/api-server/src/routers.js`
- Handles both `/trpc/*` and `/api/trpc/*` — detects endpoint from URL path
- Context: passes `{}` (all procedures are public, none access ctx)

**Why:** netlify.toml redirects both `/trpc/*` and `/api/trpc/*` to `/.netlify/functions/trpc/:splat`. The function must detect which base path was used and set `endpoint` accordingly.

## vite.config.ts — build guard
- `PORT` and `BASE_PATH` env vars are only required in dev/preview, not during `vite build`
- Guard: `const isBuildCommand = process.argv.includes('build')`
- **Why:** Netlify build doesn't provide PORT/BASE_PATH, but the build script shouldn't need them.

## Required Netlify env vars
- `DATABASE_URL` — PostgreSQL connection (required)
- `STRIPE_SECRET_KEY` — for payment intent creation (optional, fallback card form used if absent)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — notifications (optional)
- `VITE_STRIPE_PUBLISHABLE_KEY` — client-side Stripe (optional)

## lib/db TypeScript compilation
- `@workspace/db` uses project references — run `pnpm typecheck:libs` from workspace root before `pnpm -r typecheck` in api-server, otherwise TS errors about missing exports.
- `lib/db/dist/` must exist with compiled `.d.ts` files.

## GitHub push
- Token env var: `GITHUB_PERSONAL_ACCESS_TOKEN` (or `GITHUB_TOKEN_ZAIIN`)
- Workspace remote: `gitsafe-backup` (Replit internal), NOT GitHub
- To push: `git remote set-url origin "https://oauth2:$TOKEN@github.com/sdsk681-code/swiftmove.git" && git push origin main`
