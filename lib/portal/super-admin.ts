import { createAdminClient, isServiceRoleConfigured, serviceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

type InternalResult = {
  ok?: boolean;
  email?: string;
  superAdmin?: boolean;
  resend?: boolean;
  error?: string;
  missingFunction?: boolean;
};

export async function callProjectFunction(body: Record<string, unknown>): Promise<InternalResult> {
  if (!isServiceRoleConfigured() || !supabaseUrl()) return { missingFunction: true };
  try {
    const response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/joova-internal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey()}`,
        apikey: serviceRoleKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.status === 404) return { missingFunction: true };
    const data = (await response.json().catch(() => null)) as InternalResult | null;
    return data ?? { error: "invalid" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    console.error("joova-internal", message);
    return { error: "request failed" };
  }
}

let cachedEmail: { value: string; at: number } | null = null;

export async function superAdminEmail() {
  if (cachedEmail && Date.now() - cachedEmail.at < 60_000) return cachedEmail.value;
  let email = "";
  const remote = await callProjectFunction({ action: "super-admin-email" });
  if (typeof remote.email === "string" && remote.email.includes("@")) email = remote.email.trim().toLowerCase();
  if (!email && isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const vault = await admin.rpc("read_super_admin_email");
    if (!vault.error && typeof vault.data === "string" && vault.data.includes("@")) email = vault.data.trim().toLowerCase();
  }
  cachedEmail = { value: email, at: Date.now() };
  return email;
}

export async function checkSuperAdminSignIn(email: string, password: string) {
  if (!isSupabaseConfigured()) return { unavailable: true as const };
  try {
    const response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/joova-internal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey()}`,
        apikey: supabaseAnonKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "sign-in", email, password }),
    });
    if (response.status === 404) return { unavailable: true as const };
    const data = (await response.json().catch(() => null)) as { superAdmin?: boolean; passwordOk?: boolean } | null;
    if (!response.ok || !data) return { unavailable: true as const };
    return { unavailable: false as const, superAdmin: data.superAdmin === true, passwordOk: data.passwordOk === true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    console.error("joova-internal", message);
    return { unavailable: true as const };
  }
}

export async function syncSuperAdmin(email: string) {
  if (!isServiceRoleConfigured() || !email.includes("@")) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc("sync_super_admin", { p_email: email });
  if (error) console.error("sync_super_admin", error.message);
}

export async function superAdminPasswordOk(email: string, password: string) {
  if (!isServiceRoleConfigured()) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("super_admin_password_ok", { p_email: email, p_password: password });
  if (error) {
    console.error("super_admin_password_ok", error.message);
    return false;
  }
  return data === true;
}

export async function roleForAccount(email: string, storedRole: string) {
  const secret = await superAdminEmail();
  const normalized = email.trim().toLowerCase();
  if (!secret) return storedRole;
  if (normalized === secret) {
    if (storedRole !== "super_admin") await syncSuperAdmin(secret);
    return "super_admin";
  }
  if (storedRole === "super_admin") {
    await syncSuperAdmin(secret);
    return "customer";
  }
  return storedRole;
}
