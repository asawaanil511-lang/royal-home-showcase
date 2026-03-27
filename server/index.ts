import express from "express";
import cors from "cors";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = "https://xzgccthebdjchdumgrvv.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

// PostgreSQL pool — uses Replit's built-in DATABASE_URL
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
});

db.connect()
  .then((client) => {
    console.log("PostgreSQL connected");
    client.release();
  })
  .catch((err) => {
    console.warn("PostgreSQL connection warning:", err.message);
  });

// ---- login-by-username ----
app.post("/api/login-by-username", async (req, res) => {
  try {
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Server not configured. SUPABASE_SERVICE_ROLE_KEY is missing." });
    }
    const adminClient = getAdminClient();
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (!profile) return res.status(404).json({ error: "Invalid username" });

    const { data: { user } } = await adminClient.auth.admin.getUserById(profile.user_id);
    if (!user?.email) return res.status(404).json({ error: "User not found" });

    return res.json({ email: user.email });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- admin-create-user ----
app.post("/api/admin-create-user", async (req, res) => {
  try {
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Server not configured. SUPABASE_SERVICE_ROLE_KEY is missing." });
    }
    const adminClient = getAdminClient();

    // Verify caller is admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await adminClient.auth.getUser(token);
    if (!caller) return res.status(401).json({ error: "Unauthorized" });

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return res.status(403).json({ error: "Admin only" });

    const { action, username, password, user_id } = req.body;
    const DEFAULT_PASSWORD = "Abcd@1234";

    if (action === "create") {
      if (!username) return res.status(400).json({ error: "Username required" });
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@superman.local`;

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { username, display_name: username },
      });
      if (error) return res.status(400).json({ error: error.message });

      if (newUser.user) {
        await adminClient.from("profiles").update({ must_change_password: true }).eq("user_id", newUser.user.id);
      }

      return res.json({
        success: true,
        user_id: newUser.user?.id,
        username,
        email,
        default_password: DEFAULT_PASSWORD,
      });
    }

    if (action === "delete") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (action === "reset_password") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const usePassword = password || DEFAULT_PASSWORD;
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: usePassword });
      if (error) return res.status(400).json({ error: error.message });
      await adminClient.from("profiles").update({ must_change_password: true }).eq("user_id", user_id);
      return res.json({ success: true, default_password: usePassword });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- health check ----
app.get("/api/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() as time");
    return res.json({ status: "ok", db: "connected", time: result.rows[0].time });
  } catch (err: any) {
    return res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// In production, serve the built frontend static files
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath, { index: "index.html" }));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log(`Serving static files from: ${distPath}`);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
