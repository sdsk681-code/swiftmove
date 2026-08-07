/**
 * Netlify Function (v2) — wraps the tRPC router as a serverless endpoint.
 * Handles all requests to /trpc/* (configured via [[redirects]] in netlify.toml).
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../artifacts/api-server/src/routers.js";

export default async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
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
