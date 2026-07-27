import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync, existsSync } from "fs";

let config: Record<string, string> = {};
try {
  const configPath = path.join(process.cwd(), "config.json");
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  }
} catch {
  // config.json not present — env vars used
}

const SUPABASE_URL = "https://xzgccthebdjchdumgrvv.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  config.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2NjdGhlYmRqY2hkdW1ncnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTE2NTgsImV4cCI6MjA5MDAyNzY1OH0.x07A7TTZSv5hVdcoklkN-2YoNjGjmoTElN6fLRtOvvk";

const API_URL_OVERRIDE =
  process.env.VITE_API_URL || config.VITE_API_URL || "";

export default defineConfig(({ mode }) => {
  const API_URL =
    API_URL_OVERRIDE ||
    (mode === "production" ? "https://api.rstossbook.com" : "");

  return {
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(SUPABASE_ANON_KEY),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_ANON_KEY),
      "import.meta.env.VITE_API_URL": JSON.stringify(API_URL),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./attached_assets"),
      },
    },
    build: {
      // Split vendor code into separately cached chunks
      // so returning users don't re-download unchanged libraries
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — smallest, fastest to parse
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // Supabase — auth/realtime (large, rarely changes)
            if (id.includes("node_modules/@supabase/")) {
              return "vendor-supabase";
            }
            // Framer Motion — animation engine (large, rarely changes)
            if (id.includes("node_modules/framer-motion")) {
              return "vendor-motion";
            }
            // Lucide icons — icon set (large, rarely changes)
            if (id.includes("node_modules/lucide-react")) {
              return "vendor-icons";
            }
            // Radix UI primitives
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
            // TanStack Query
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            // React Router
            if (id.includes("node_modules/react-router") || id.includes("node_modules/react-router-dom")) {
              return "vendor-router";
            }
          },
        },
      },
      // Raise the chunk size warning threshold — we're intentionally splitting
      chunkSizeWarningLimit: 600,
    },
  };
});
