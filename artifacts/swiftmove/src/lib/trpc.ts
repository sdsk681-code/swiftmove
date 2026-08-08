import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api-server/src/routers";

export const trpc = createTRPCReact<AppRouter>();
