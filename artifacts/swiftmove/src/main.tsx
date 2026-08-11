import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// VITE_TRPC_URL overrides the default.
// Netlify build: VITE_TRPC_URL=/trpc (set in netlify.toml)
// Replit dev/prod: falls back to /api/trpc (Replit routes /api → api-server port 8080)
const apiBase =
  import.meta.env.VITE_TRPC_URL ||
  `/api/trpc`;

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiBase,
      transformer: superjson,
      async fetch(input, init) {
        const res = await globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
        // Temporary diagnostic logging for production API debugging
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("json")) {
          const u = new URL(res.url);
          console.error(
            `[tRPC] Unexpected API response: url=${u.origin}${u.pathname} status=${res.status} ${res.statusText} content-type=${ct}`
          );
        }
        return res;
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
