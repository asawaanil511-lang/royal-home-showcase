import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let config: any = {};
try {
  const configPath = path.join(process.cwd(), "config.json");
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  }
} catch {}

const supabaseUrl: string =
  process.env.SUPABASE_URL || config.SUPABASE_URL || "https://xzgccthebdjchdumgrvv.supabase.co";
const serviceRoleKey: string =
  process.env.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = `${username}@superman.local`;

  const password =
    process.env.ADMIN_PASSWORD ||
    (await prompt("Enter admin password (min 8 chars): "));

  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log("Checking for existing admin user...");
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  let userId: string;

  if (existingProfile) {
    console.log("Admin user already exists — resetting password...");
    const { error } = await supabase.auth.admin.updateUserById(existingProfile.user_id, { password });
    if (error) { console.error("Failed to update password:", error.message); process.exit(1); }
    userId = existingProfile.user_id;
  } else {
    console.log("Creating admin user...");
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: "Admin" },
    });
    if (error) { console.error("Failed to create user:", error.message); process.exit(1); }
    userId = newUser.user!.id;
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  if (roleError) {
    console.error("Failed to assign admin role:", roleError.message);
    process.exit(1);
  }

  await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", userId);

  console.log("Admin user ready!");
  console.log(`   Username : ${username}`);
  console.log(`   Email    : ${email}`);
  console.log(`   User ID  : ${userId}`);
}

createAdmin();
