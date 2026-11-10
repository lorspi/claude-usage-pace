import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { proxyAnthropicUsage } from "./src/lib/proxy-usage";

/**
 * En desarrollo, Vite sirve el proxy `/api/usage` para que el front no tenga
 * que llamar directamente a Anthropic (evita CORS y bloqueadores). En producción
 * Cloudflare Pages sirve `functions/api/usage.ts`.
 */
function devUsageProxy(): Plugin {
  return {
    name: "dev-usage-proxy",
    configureServer(server) {
      server.middlewares.use("/api/usage", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-claude-token");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        const token = req.headers["x-claude-token"] as string | undefined;
        if (!token) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "missing token" }));
          return;
        }

        const { status, body, contentType } = await proxyAnthropicUsage(token);
        res.statusCode = status;
        res.setHeader("content-type", contentType);
        res.end(body);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["test.lorspi.com"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), devUsageProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
