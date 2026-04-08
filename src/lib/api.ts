// In dev: empty string → Vite proxy forwards /api/* to localhost:3001
// In prod (Vercel): use the Render backend URL
const base = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : "https://api.betwictossbook.com")
).replace(/\/$/, "");

export const apiUrl = (path: string) => `${base}${path}`;
