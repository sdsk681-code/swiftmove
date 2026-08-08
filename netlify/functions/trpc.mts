/**
 * Netlify serverless function: proxies all /trpc/* requests to the tRPC router.
 *
 * Required environment variables in Netlify dashboard:
 *   DATABASE_URL         — PostgreSQL connection string
 *   STRIPE_SECRET_KEY    — Stripe secret key (optional: only for payment intent creation)
 *   TELEGRAM_BOT_TOKEN   — Telegram notifications (optional)
 *   TELEGRAM_CHAT_ID     — Telegram chat ID (optional)
 *
 * The netlify.toml redirect sends /trpc/* → /.netlify/functions/trpc/:splat
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../artifacts/api-server/src/routers.js";

export default async (request: Request): Promise<Response> => {
  return fetchRequestHandler({
    endpoint: "/.netlify/functions/trpc",
    req: request,
    router: appRouter,
    // None of the procedures access context — safe to pass empty object
    createContext: () => ({}) as any,
    onError({ error, path }) {
      console.error(`tRPC error on ${path ?? "unknown"}:`, error.message);
    },
  });
};
