import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import path from "path";

type AdminInput = {
  username: string | undefined;
  password: string | undefined;
};

const configPath = path.join(process.cwd(), "config.json");
const config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : {};

const supabaseUrl =
  process.env.SUPABASE_URL ||
  config.SUPABASE_URL ||
  "https://xzgccthebdjchdumgrvv.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  config.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const adminUsernames = ["waqas2004", "rajat2004", "rajesh2004"];
const admins: AdminInput[] = adminUsernames.map((username, index) => ({
  username,
  password: process.env[`ADMIN_${index + 1}_PASSWORD`],
}));

if (admins.some(({ username, password }) => !username || !password)) {
  console.error("ADMIN_1_PASSWORD, ADMIN_2_PASSWORD, and ADMIN_3_PASSWORD are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const createOrUpdateAdmin = async ({ username, password }: Required<AdminInput>) => {
  const email = `${username}@rstossbook.local`;
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (profileLookupError) throw profileLookupError;

  let userId = existingProfile?.user_id;
  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email,
      email_confirm: true,
      user_metadata: { username, display_name: "Admin" },
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: "Admin" },
    });
    if (error) throw error;
    userId = data.user?.id;
  }

  if (!userId) throw new Error(`Could not determine user ID for ${username}.`);

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  if (roleError) throw roleError;

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ username, display_name: "Admin", must_change_password: false })
    .eq("user_id", userId);
  if (updateProfileError) throw updateProfileError;

  console.log(`Admin account ready: ${username}`);
};

const main = async () => {
  for (const admin of admins) {
    await createOrUpdateAdmin(admin as Required<AdminInput>);
  }
  console.log("All admin accounts are ready.");
};

main().catch((error) => {
  console.error("Admin setup failed:", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});