import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";

export interface Context {
  /** Bearer token extracted from the Authorization header (if any). */
  authToken: string | null;
  req?: Request;
  res?: Response;
}

function extractBearer(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/** Express adapter context (dev server). */
export function createContext({ req, res }: { req: Request; res: Response }): Context {
  return {
    authToken: extractBearer(req.headers.authorization),
    req,
    res,
  };
}

/** Fetch adapter context (Netlify serverless function). */
export function createFetchContext({ req }: { req: globalThis.Request }): Context {
  return { authToken: extractBearer(req.headers.get("authorization")) };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Admin-only procedure. Requires `Authorization: Bearer <ADMIN_API_TOKEN>`.
 * Fails closed: if ADMIN_API_TOKEN is not configured, all admin calls are rejected.
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access is not configured (ADMIN_API_TOKEN missing)",
    });
  }
  if (!ctx.authToken || !safeEqual(ctx.authToken, expected)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  }
  return next();
});
