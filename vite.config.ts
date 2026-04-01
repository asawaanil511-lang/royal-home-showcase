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

// Public anon key — safe to hardcode (intentionally public, same as the URL)
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  config.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2NjdGhlYmRqY2hkdW1ncnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTE2NTgsImV4cCI6MjA5MDAyNzY1OH0.x07A7TTZSv5hVdcoklkN-2YoNjGjmoTElN6fLRtOvvk";

// Explicit override from env or config (set on Vercel as VITE_API_URL)
const API_URL_OVERRIDE =
  process.env.VITE_API_URL || config.VITE_API_URL || "";

export default defineConfig(({ mode }) => {
  // In dev: empty string → Vite proxy forwards /api/* to localhost:3001
  // In production build (Vercel): use the Render backend URL
  const API_URL =
    API_URL_OVERRIDE ||
    (mode === "production" ? "https://api.betwictossbook.com" : "");

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
  };
});
