---
name: SwiftMove API & Firebase Authorization
description: Durable security decisions for the SwiftMove booking API and Firebase access model.
---

## Decisions

- Admin tRPC procedures require a Bearer `ADMIN_API_TOKEN` and **fail closed** (401) when the env var is unset. Booking/contact creation stays public for visitors.
  **Why:** bookings contain PII and the API is public on Netlify; a missing token must never mean open access.
  **How to apply:** the token must be set in Replit secrets (dev) and Netlify env vars (prod); the dashboard must send it with admin calls.

- Payment state is never trusted from the client when Stripe is configured: the server retrieves the intent, checks booking binding and amount, and derives the status itself. Payment intents are created with the booking's server-side deposit amount, not a client amount.
  **Why:** a public updatePayment that accepts a client status is a payment-forgery hole flagged in code review.

- Firebase access uses an ownership model: the visitor site signs in with **anonymous Firebase Auth** and stamps `ownerUid` on its `pays` doc; rules let only the owner read/update it, while non-anonymous (admin) users read/list everything.
  **Why:** fully-open rules exposed all visitor PII; anonymous auth preserves the no-account visitor flow while establishing ownership.
  **How to apply:** Anonymous + a real provider must be enabled in Firebase Console; rules live in `firebase/` and must be deployed via Console manually; the dashboard must sign in with a non-anonymous account or it loses read access.
