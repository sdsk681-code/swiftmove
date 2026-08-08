---
name: SwiftMove Firebase Integration
description: Data integration between swiftmove (visitor site) and swiftmove-L (admin dashboard) via Firebase project swiftmove-l.
---

## Architecture

- Firebase project: `swiftmove-l`
- Firestore collection: `pays` — visitor docs, read by the dashboard's `InsuranceApplication` type
- RTDB path: `/presence/{docId}` — Online/Offline with `onDisconnect`
- Both repos point to the same Firebase project; no separate backend needed

## Field Mapping (visitor → dashboard)

| swiftmove field | pays doc field | notes |
|---|---|---|
| name | ownerName | set on `details_filled` step |
| phone | phoneNumber | set on `details_filled` step |
| email | email | set on `details_filled` step |
| auto | referenceNumber | SM-{timestamp}, set on first visit |
| auto | isOnline / online | true on connect, false on disconnect |
| auto | lastActiveAt | heartbeat every 25s |
| auto | deviceType, browser, os | from userAgent |

## Key Files (swiftmove visitor)

- `src/lib/firebase-visitor.ts` — Firebase config for project swiftmove-l
- `src/hooks/useFirebaseTracking.ts` — creates Firestore doc on visit, RTDB presence, booking step updates
- `src/App.tsx` — renders `<VisitorPresenceInit />` at app root so tracking starts from any page
- sessionStorage key: `swiftmove_fid` — reuses same doc on browser refresh

## Key Files (swiftmove-L dashboard)

- `lib/firebase-services.ts` — added `subscribeToPresence()` for RTDB listener
- `app/page.tsx` — `rtdbPresence` state overrides `isOnline` in `filteredApplications` useMemo

## tRPC Backend (api-server)

- `src/trpc.ts` — tRPC init with superjson transformer
- `src/db.ts` — booking/contact DB operations
- `src/routers.ts` — bookings + contacts routers (Stripe optional, graceful if no key)
- `src/telegram.ts` — Telegram notification (no-op if env vars missing)
- DB schema: `bookingsTable`, `contactsTable` (enums: payment_status, booking_status)

## tRPC URL

Frontend points to `/api/trpc` (api-server serves under `/api`).
Override with `VITE_TRPC_URL` env var if needed.

**Why:** The original repo used `/api-server/api/trpc` as fallback (Netlify convention). Replit api-server is at `/api`.

## Integration Patches (for GitHub push)

Ready-to-apply patches in `integration-patches/`:
- `swiftmove-integration.patch` — visitor site changes
- `swiftmove-L-presence.patch` — dashboard changes
- `swiftmove-files/` and `swiftmove-L-files/` — individual files
- `SETUP-GUIDE.md` — step-by-step Arabic/English guide

## Firebase Security Rules (user must configure)

- Firestore `pays` collection: allow unauthenticated reads/writes from any origin
- RTDB `/presence/**`: allow unauthenticated writes

**Why:** Both visitor site and dashboard are unauthenticated clients writing directly to Firebase.
