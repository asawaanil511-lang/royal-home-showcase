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

// CORS — allow all origins (API is secured by Supabase JWT tokens, not CORS)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

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

function getSslConfig(url: string) {
  if (!url || url.includes("localhost") || url.includes("127.0.0.1")) return false;
  // Supabase pooler requires rejectUnauthorized: false due to their certificate chain
  if (url.includes(".supabase.com") || url.includes(".pooler.supabase")) {
    return { rejectUnauthorized: false };
  }
  return true;
}

export const db = new Pool({
  connectionString: dbUrl,
  ssl: getSslConfig(dbUrl),
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
      CREATE TABLE IF NOT EXISTS public.user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        browser TEXT,
        os TEXT,
        device_type TEXT,
        session_token TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now(),
        last_seen TIMESTAMPTZ DEFAULT now()
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

// ---- Input validation helpers ----
function isValidUsername(u: unknown): u is string {
  return typeof u === "string" && /^[a-zA-Z0-9_]{1,50}$/.test(u.trim());
}
function isValidUUID(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function isValidAmount(a: unknown): a is number {
  const n = Number(a);
  return !isNaN(n) && n >= 0 && n <= 10_000_000;
}

// ---- login-by-username ----
app.post("/api/login-by-username", async (req, res) => {
  try {
    if (!serviceRoleKey) return res.status(500).json({ error: "Server not configured." });
    const adminClient = getAdminClient();
    const { username } = req.body;
    if (!isValidUsername(username)) return res.status(400).json({ error: "Invalid username" });
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
      if (!isValidUsername(username)) return res.status(400).json({ error: "Invalid username (letters, numbers, underscores only, max 50)" });
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@superman.local`;
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email, password: DEFAULT_PASSWORD, email_confirm: true,
        user_metadata: { username, display_name: username },
      });
      if (error) return res.status(400).json({ error: error.message });
      if (newUser.user) {
        // Wait briefly for the DB trigger to create the profile row, then upsert to guarantee username is set
        await new Promise(r => setTimeout(r, 800));
        await adminClient.from("profiles").upsert({
          user_id: newUser.user.id,
          username,
          display_name: username,
          avatar_url: "https://xzgccthebdjchdumgrvv.supabase.co/storage/v1/object/public/assets/betwic-logo.jpg",
          must_change_password: true,
          wallet_balance: 0,
        }, { onConflict: "user_id" });
      }
      return res.json({ success: true, user_id: newUser.user?.id, username, email, default_password: DEFAULT_PASSWORD });
    }

    if (action === "delete") {
      if (!isValidUUID(user_id)) return res.status(400).json({ error: "Invalid user_id" });
      if (user_id === adminId) return res.status(403).json({ error: "Admins cannot delete their own account." });
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (action === "reset_password") {
      if (!isValidUUID(user_id)) return res.status(400).json({ error: "Invalid user_id" });
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
    if (!isValidUUID(user_id) || !action || amount === undefined) {
      return res.status(400).json({ error: "user_id, action and amount required" });
    }
    if (!isValidAmount(amount)) {
      return res.status(400).json({ error: "Invalid amount (must be 0–10,000,000)" });
    }
    if (note && (typeof note !== "string" || note.length > 500)) {
      return res.status(400).json({ error: "Note too long (max 500 chars)" });
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

// ---- Helper: verify any authenticated user ----
async function verifyUser(req: express.Request, res: express.Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = authHeader.replace("Bearer ", "");
  const adminClient = getAdminClient();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return user.id;
}

// ---- Session record (called after login) ----
app.post("/api/sessions/record", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;
    const { browser, os, device_type, session_token } = req.body;
    if (!session_token) return res.status(400).json({ error: "session_token required" });

    await db.query(
      `INSERT INTO public.user_sessions (user_id, browser, os, device_type, session_token, created_at, last_seen)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (session_token) DO UPDATE SET last_seen = NOW()`,
      [userId, browser || "Unknown", os || "Unknown", device_type || "Desktop", session_token]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Get all sessions for current user ----
app.get("/api/sessions", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;
    const currentToken = (req.headers.authorization || "").replace("Bearer ", "");
    // hash the current token for comparison (first 20 chars used as identifier)
    const currentTokenPrefix = currentToken.slice(0, 20);

    const result = await db.query(
      `SELECT id, browser, os, device_type, session_token, created_at, last_seen
       FROM public.user_sessions WHERE user_id = $1 ORDER BY last_seen DESC`,
      [userId]
    );
    const sessions = result.rows.map((row: any) => ({
      ...row,
      is_current: row.session_token === currentTokenPrefix,
    }));
    return res.json({ sessions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Revoke a session ----
app.delete("/api/sessions/:id", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;
    const { id } = req.params;
    await db.query(
      `DELETE FROM public.user_sessions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Revoke all other sessions ----
app.delete("/api/sessions", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;
    const currentToken = (req.headers.authorization || "").replace("Bearer ", "");
    const currentTokenPrefix = currentToken.slice(0, 20);
    await db.query(
      `DELETE FROM public.user_sessions WHERE user_id = $1 AND session_token != $2`,
      [userId, currentTokenPrefix]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Admin: cancel match + atomically refund all pending bets ----
app.post("/api/admin/cancel-match", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;

    const { match_id } = req.body;
    if (!isValidUUID(match_id)) return res.status(400).json({ error: "Invalid match_id" });

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Mark match as cancelled
      await client.query(
        `UPDATE public.matches SET status = 'cancelled', winner = NULL WHERE id = $1`,
        [match_id]
      );

      // Get all pending bets for this match
      const betsResult = await client.query(
        `UPDATE public.bets SET result = 'cancelled', settled_at = NOW()
         WHERE match_id = $1 AND result = 'pending'
         RETURNING user_id, amount`,
        [match_id]
      );

      // Refund each user atomically
      for (const row of betsResult.rows) {
        await client.query(
          `UPDATE public.profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2`,
          [Number(row.amount), row.user_id]
        );
      }

      await client.query("COMMIT");
      return res.json({ success: true, refunded: betsResult.rowCount });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Admin: settle match winner + atomically pay out winning bets ----
app.post("/api/admin/settle-match", async (req, res) => {
  try {
    const adminId = await verifyAdmin(req, res);
    if (!adminId) return;

    const { match_id, winner } = req.body;
    if (!isValidUUID(match_id) || !winner) return res.status(400).json({ error: "match_id and winner required" });
    if (!["A", "B"].includes(winner)) return res.status(400).json({ error: "winner must be A or B" });

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Update match
      await client.query(
        `UPDATE public.matches SET winner = $1, status = 'closed' WHERE id = $2`,
        [winner, match_id]
      );

      // Settle all pending bets
      const betsResult = await client.query(
        `UPDATE public.bets
         SET result = CASE WHEN team_picked = $1 THEN 'won' ELSE 'lost' END,
             settled_at = NOW()
         WHERE match_id = $2 AND result = 'pending'
         RETURNING user_id, team_picked, potential_win`,
        [winner, match_id]
      );

      // Pay out winners atomically
      for (const row of betsResult.rows) {
        if (row.team_picked === winner) {
          await client.query(
            `UPDATE public.profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2`,
            [Number(row.potential_win), row.user_id]
          );
        }
      }

      await client.query("COMMIT");
      return res.json({ success: true, settled: betsResult.rowCount });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Cancel bet (atomic: cancel + refund in one transaction) ----
app.post("/api/cancel-bet", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;

    const { bet_id } = req.body;
    if (!bet_id) return res.status(400).json({ error: "bet_id required" });

    // Use a PostgreSQL transaction so cancel + refund are atomic
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Only cancel if the bet is still pending, belongs to this user, and the match is still live/upcoming
      const cancelResult = await client.query(
        `UPDATE public.bets b
         SET result = 'cancelled', settled_at = NOW()
         FROM public.matches m
         WHERE b.id = $1
           AND b.user_id = $2
           AND b.result = 'pending'
           AND b.match_id = m.id
           AND m.status IN ('upcoming', 'live')
         RETURNING b.amount`,
        [bet_id, userId]
      );

      if (cancelResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Bet cannot be cancelled — already settled or match is closed" });
      }

      const refundAmount = Number(cancelResult.rows[0].amount);

      // Atomically add refund — no race condition possible
      await client.query(
        `UPDATE public.profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2`,
        [refundAmount, userId]
      );

      await client.query("COMMIT");
      return res.json({ success: true, refunded: refundAmount });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Change password (server-side, avoids JWT sub claim issues) ----
app.post("/api/change-password", async (req, res) => {
  try {
    const userId = await verifyUser(req, res);
    if (!userId) return;
    const { new_password } = req.body;
    if (!new_password || typeof new_password !== "string" || new_password.length < 8 || new_password.length > 128) {
      return res.status(400).json({ error: "Password must be 8–128 characters" });
    }
    const adminClient = getAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: new_password });
    if (error) return res.status(400).json({ error: error.message });
    await adminClient.from("profiles").update({ must_change_password: false }).eq("user_id", userId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---- Root ----
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Betwic API is running. Use /api/health to check DB." });
});

// ---- Health check ----
app.get("/api/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() as time");
    return res.json({ status: "ok", db: "connected", time: result.rows[0].time });
  } catch (err: any) {
    return res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// Serve frontend static files only when running as a single combined server
// (not when frontend is deployed separately on Vercel/Netlify)
const isApiOnly = process.env.API_ONLY === "true";
if (process.env.NODE_ENV === "production" && !isApiOnly) {
  const distPath = path.resolve(process.cwd(), "dist");
  if (existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath, { index: "index.html" }));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from: ${distPath}`);
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
