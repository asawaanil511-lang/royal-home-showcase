import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const config = require("./config.json");

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
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://xzgccthebdjchdumgrvv.supabase.co"),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(config.VITE_SUPABASE_ANON_KEY),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(config.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
