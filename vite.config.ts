import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

let config: Record<string, string> = {};
try {
  const require = createRequire(import.meta.url);
  config = require("./config.json");
} catch {
  // config.json not present — env vars will be used at runtime
}

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY || "";

export default defineConfig(({ mode }) => ({
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
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      "https://xzgccthebdjchdumgrvv.supabase.co"
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseAnonKey),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
