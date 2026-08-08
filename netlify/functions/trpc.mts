/**
 * Netlify Function (v2) — wraps the tRPC router as a serverless endpoint.
 * Handles /trpc/* and /api/trpc/* (both paths configured in netlify.toml redirects).
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../artifacts/api-server/src/routers.js";

export default async (req: Request) => {
  const url = new URL(req.url);
  // Detect which base path the request came through
  const endpoint = url.pathname.startsWith("/api/trpc") ? "/api/trpc" : "/trpc";

  return fetchRequestHandler({
    endpoint,
    req,
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error }) => {
      console.error("tRPC error:", error);
    },
  });
};

export const config = {
  path: "/trpc/*",
};
