import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

function serviceRoleFromProperties() {
  try {
    const file = path.join(process.cwd(), "config", "supabase.local.properties");
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      if (!line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) continue;
      return line.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim();
    }
  } catch {
    return "";
  }
  return "";
}

let cachedKey = "";

export function serviceRoleKey() {
  if (cachedKey.length > 30 && !cachedKey.includes("YOUR_")) return cachedKey;
  const fromFile = serviceRoleFromProperties();
  const fromEnv = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const key = fromFile.length > 30 && !fromFile.includes("YOUR_") ? fromFile : fromEnv;
  if (key.length > 30 && !key.includes("YOUR_")) cachedKey = key;
  return key;
}

export function isServiceRoleConfigured() {
  const key = serviceRoleKey();
  return key.length > 30 && !key.includes("YOUR_");
}

export function createAdminClient() {
  if (!isServiceRoleConfigured()) {
    throw new Error("The server-only service role key is missing.");
  }
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
