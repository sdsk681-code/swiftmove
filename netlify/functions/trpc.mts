/**
 * Netlify Function (v2) — wraps the tRPC router as a serverless endpoint.
 * Handles /trpc/* and /api/trpc/* (both paths configured in netlify.toml redirects).
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../artifacts/api-server/src/routers.js";

export default async (req: Request) => {
  const url = new URL(req.url);
  // Detect which base path the request came through.
  // Requests may arrive via /trpc/*, /api/trpc/*, or the direct
  // /.netlify/functions/trpc/* URL (used by the netlify.toml redirects).
  const endpoint = url.pathname.startsWith("/.netlify/functions/trpc")
    ? "/.netlify/functions/trpc"
    : url.pathname.startsWith("/api/trpc")
      ? "/api/trpc"
      : "/trpc";

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
