import express from "express";
import cors from "cors";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

let appConfig: Record<string, string> = {};
try {
  const configPath = path.join(process.cwd(), "config.json");
  if (existsSync(configPath)) {
    appConfig = JSON.parse(readFileSync(configPath, "utf8"));
  }
} catch {
  // config.json not present — fall back to environment variables
}

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = "https://xzgccthebdjchdumgrvv.supabase.co";
const serviceRoleKey: string =
  process.env.SUPABASE_SERVICE_ROLE_KEY || appConfig.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

const dbUrl: string =
  process.env.SUPABASE_DATABASE_URL ||
  appConfig.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "";

export const db = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
});

db.connect()
  .then((client) => {
    console.log("PostgreSQL connected");
    client.release();
    setupTables();
  })
  .catch((err) => {
    console.warn("PostgreSQL connection warning:", err.message);
  });

// ---- Auto-create helper tables ----
const setupTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.wallet_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        admin_user_id UUID,
        action TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        balance_before NUMERIC NOT NULL,
        balance_after NUMERIC NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS public.announcements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("Helper tables ready");
  } catch (err: any) {
    console.warn("Table setup warning:", err.message);
  }
};

// ---- Helper: verify admin ----
async function verifyAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = authHeader.replace("Bearer ", "");
  const adminClient = getAdminClient();
  const { data: { user: caller } } = await adminClient.auth.getUser(token);
  if (!caller) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
  if (!roleData) { res.status(403).json({ error: "Admin only" }); return null; }
  return caller.id;
}

// ---- login-by-username ----
app.post("/api/login-by-username", async (req, res) => {
  try {
    if (!serviceRoleKey) return res.status(500).json({ error: "Server not configured." });
    const adminClient = getAdminClient();
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("username", username).maybeSingle();
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
    if (!serviceRoleKey) return res.status(500).json({ error: "Server not configured." });
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;

    const { action, username, password, user_id } = req.body;
    const adminClient = getAdminClient();
    const DEFAULT_PASSWORD = "Abcd@1234";

    if (action === "create") {
      if (!username) return res.status(400).json({ error: "Username required" });
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@superman.local`;
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email, password: DEFAULT_PASSWORD, email_confirm: true,
        user_metadata: { username, display_name: username },
      });
      if (error) return res.status(400).json({ error: error.message });
      if (newUser.user) {
        await adminClient.from("profiles").update({ must_change_password: true }).eq("user_id", newUser.user.id);
      }
      return res.json({ success: true, user_id: newUser.user?.id, username, email, default_password: DEFAULT_PASSWORD });
    }

    if (action === "delete") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      if (user_id === adminId) return res.status(403).json({ error: "Admins cannot delete their own account." });
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

// ---- Admin wallet update + transaction log ----
app.post("/api/admin-wallet", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;

    const { user_id, action, amount, note } = req.body;
    if (!user_id || !action || amount === undefined) {
      return res.status(400).json({ error: "user_id, action and amount required" });
    }

    const adminClient = getAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("wallet_balance").eq("user_id", user_id).single();
    if (!profile) return res.status(404).json({ error: "User not found" });

    const currentBalance = Number(profile.wallet_balance);
    let newBalance: number;
    if (action === "set") newBalance = Number(amount);
    else if (action === "add") newBalance = currentBalance + Number(amount);
    else if (action === "deduct") newBalance = Math.max(0, currentBalance - Number(amount));
    else return res.status(400).json({ error: "Invalid action" });

    const { error: updateError } = await adminClient.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user_id);
    if (updateError) return res.status(400).json({ error: updateError.message });

    await db.query(
      `INSERT INTO public.wallet_transactions (user_id, admin_user_id, action, amount, balance_before, balance_after, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user_id, adminId, action, Number(amount), currentBalance, newBalance, note || null]
    );

    return res.json({ success: true, balance_before: currentBalance, balance_after: newBalance });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Wallet transaction history ----
app.get("/api/wallet-history/:userId", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    const { userId } = req.params;
    const result = await db.query(
      `SELECT * FROM public.wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.json({ transactions: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Demo login ----
app.post("/api/demo-login", async (req, res) => {
  try {
    if (!serviceRoleKey) return res.status(500).json({ error: "Server not configured" });
    const adminClient = getAdminClient();
    const DEMO_USERNAME = "demo";
    const DEMO_EMAIL = "demo@superman.local";
    const DEMO_PASSWORD = "Demo@1234";
    const DEMO_WALLET = 5;

    const { data: existingProfile } = await adminClient.from("profiles").select("user_id").eq("username", DEMO_USERNAME).maybeSingle();
    if (!existingProfile) {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
        user_metadata: { username: DEMO_USERNAME, display_name: "Demo User 🎮" },
      });
      if (createErr) return res.status(400).json({ error: createErr.message });
      if (newUser.user) {
        await adminClient.from("profiles").update({ wallet_balance: DEMO_WALLET, must_change_password: false }).eq("user_id", newUser.user.id);
      }
    } else {
      await adminClient.auth.admin.updateUserById(existingProfile.user_id, { password: DEMO_PASSWORD, email: DEMO_EMAIL });
      await adminClient.from("profiles").update({ wallet_balance: DEMO_WALLET, must_change_password: false }).eq("user_id", existingProfile.user_id);
    }
    return res.json({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Announcements (public read) ----
app.get("/api/announcements", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 5`
    );
    return res.json({ announcements: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Announcements admin (all) ----
app.get("/api/announcements/all", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    const result = await db.query(`SELECT * FROM public.announcements ORDER BY created_at DESC`);
    return res.json({ announcements: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Create announcement ----
app.post("/api/announcements", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    const { message, type } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    const result = await db.query(
      `INSERT INTO public.announcements (message, type, is_active, created_by) VALUES ($1, $2, true, $3) RETURNING *`,
      [message, type || "info", adminId]
    );
    return res.json({ announcement: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Toggle announcement ----
app.patch("/api/announcements/:id", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    const { id } = req.params;
    const { is_active } = req.body;
    const result = await db.query(
      `UPDATE public.announcements SET is_active = $1 WHERE id = $2 RETURNING *`,
      [is_active, id]
    );
    return res.json({ announcement: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Delete announcement ----
app.delete("/api/announcements/:id", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    const { id } = req.params;
    await db.query(`DELETE FROM public.announcements WHERE id = $1`, [id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Upload match image (admin only) ----
app.post("/api/upload-match-image", async (req, res) => {
  try {
    if (!serviceRoleKey) return res.status(500).json({ error: "Server not configured." });
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;

    const { base64, mimeType, fileName } = req.body;
    if (!base64 || !mimeType || !fileName) {
      return res.status(400).json({ error: "base64, mimeType and fileName required" });
    }

    const adminClient = getAdminClient();
    const BUCKET = "match-images";

    // Strip the data URL prefix if present
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;
    const buffer = Buffer.from(raw, "base64");

    // Try to ensure bucket exists
    try {
      await (adminClient as any).storage.createBucket(BUCKET, { public: true });
    } catch {
      // Bucket may already exist — continue
    }

    const safeName = `match-${Date.now()}-${fileName.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error: uploadError } = await (adminClient as any).storage
      .from(BUCKET)
      .upload(safeName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    const { data: urlData } = (adminClient as any).storage.from(BUCKET).getPublicUrl(safeName);
    return res.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- DB migration ----
const MIGRATION_SQL = `
  ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS live_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closing_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_url TEXT;
`;

app.post("/api/migrate", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;
    try {
      await db.query(MIGRATION_SQL);
      return res.json({ success: true, message: "Migration applied" });
    } catch (pgErr: any) {
      return res.json({ success: false, manual: true, sql: MIGRATION_SQL.trim(), message: "Run SQL manually in Supabase Dashboard" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Auto-update match statuses ----
const autoUpdateMatchStatuses = async () => {
  if (!serviceRoleKey) return;
  const adminClient = getAdminClient();
  const now = new Date().toISOString();
  try {
    await (adminClient as any).from("matches").update({ status: "live" }).lte("live_time", now).eq("status", "upcoming").not("live_time", "is", null);
    await (adminClient as any).from("matches").update({ status: "closed" }).lte("closing_time", now).in("status", ["live", "upcoming"]).not("closing_time", "is", null);
  } catch { }
};
autoUpdateMatchStatuses();
setInterval(autoUpdateMatchStatuses, 30000);

// ---- Health check ----
app.get("/api/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() as time");
    return res.json({ status: "ok", db: "connected", time: result.rows[0].time });
  } catch (err: any) {
    return res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

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
