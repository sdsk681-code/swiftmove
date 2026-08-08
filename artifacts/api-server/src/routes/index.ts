import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "../trpc";

const router: IRouter = Router();

router.use(healthRouter);

// tRPC handler — handles all /trpc/* requests
router.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default router;
