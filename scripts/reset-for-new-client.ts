/**
 * Reset script for new client onboarding.
 * - Clears: bets, matches, coin_flips, wallet_transactions, announcements, user_sessions
 * - Keeps: profiles (structure), user_roles
 * - Resets all user passwords to the default
 * - Resets all wallet balances to 0
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Pool } = pg;

// Load config
let appConfig: Record<string, string> = {};
const configPath = path.join(process.cwd(), "config.json");
if (existsSync(configPath)) {
  appConfig = JSON.parse(readFileSync(configPath, "utf8"));
}

const supabaseUrl = "https://xzgccthebdjchdumgrvv.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || appConfig.SUPABASE_SERVICE_ROLE_KEY || "";
const dbUrl = process.env.SUPABASE_DATABASE_URL || appConfig.SUPABASE_DATABASE_URL || "";

const DEFAULT_PASSWORD = "Abcd@1234";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function clearTables() {
  const client = await pool.connect();
  try {
    console.log("🗑️  Clearing data tables...");
    await client.query(`
      TRUNCATE TABLE
        public.bets,
        public.matches,
        public.coin_flips,
        public.wallet_transactions,
        public.announcements,
        public.user_sessions
      RESTART IDENTITY CASCADE;
    `);
    console.log("✅  Tables cleared: bets, matches, coin_flips, wallet_transactions, announcements, user_sessions");

    // Reset all wallet balances to 0
    await client.query(`UPDATE public.profiles SET wallet_balance = 0;`);
    // Mark all users as needing password change
    await client.query(`UPDATE public.profiles SET must_change_password = true;`);
    console.log("✅  Wallet balances reset to 0, must_change_password = true for all users");
  } finally {
    client.release();
  }
}

async function resetPasswords() {
  console.log("\n🔑  Resetting all user passwords...");

  // List all users (paginated)
  let page = 1;
  let total = 0;
  const pageSize = 50;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });

    if (error) {
      console.error("Error listing users:", error.message);
      break;
    }

    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: DEFAULT_PASSWORD }
      );
      if (updateError) {
        console.error(`  ✗ Failed for ${user.email}: ${updateError.message}`);
      } else {
        console.log(`  ✓ Reset: ${user.email}`);
        total++;
      }
    }

    if (users.length < pageSize) break;
    page++;
  }

  console.log(`\n✅  Passwords reset for ${total} user(s) → default: "${DEFAULT_PASSWORD}"`);
}

async function main() {
  try {
    await clearTables();
    await resetPasswords();
    console.log("\n🎉  Reset complete. Ready for new client!");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
