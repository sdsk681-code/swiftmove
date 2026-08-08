import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";

export interface Context {
  req: Request;
  res: Response;
}

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  return { req, res };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
