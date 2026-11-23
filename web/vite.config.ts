import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
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
    allowedHosts: ["test.lorspi.com", "test2.lorspi.com"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    devUsageProxy(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "favicon-16x16.png", "apple-touch-icon.png"],
      manifest: {
        name: "Claude Quota Pace",
        short_name: "Quota Pace",
        description: "Mide el uso de tus cuentas de Claude contra el tiempo de corte.",
        theme_color: "#1a1c20",
        background_color: "#1a1c20",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "es",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
