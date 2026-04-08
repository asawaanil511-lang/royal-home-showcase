// API calls always use relative paths so they work on any host (dev or prod)
const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const apiUrl = (path: string) => `${base}${path}`;
