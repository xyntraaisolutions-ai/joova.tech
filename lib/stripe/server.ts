import Stripe from "stripe";
import { createAdminClient, isServiceRoleConfigured, serviceRoleKey } from "@/lib/supabase/admin";
import { supabaseUrl } from "@/lib/supabase/env";

async function vaultSecret(fn: "read_stripe_key" | "read_stripe_webhook_secret") {
  if (!isServiceRoleConfigured()) return "";
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(fn);
  if (error || typeof data !== "string") return "";
  return data.trim();
}

function usableSecret(value: string) {
  return value.startsWith("sk_") || value.startsWith("rk_");
}

let cachedKey = "";

async function projectStripeKey() {
  const vault = await vaultSecret("read_stripe_key");
  if (usableSecret(vault)) return vault;
  if (!isServiceRoleConfigured() || !supabaseUrl()) return "";
  try {
    const response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/joova-internal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey()}`,
        apikey: serviceRoleKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "stripe-secret" }),
    });
    const data = (await response.json().catch(() => null)) as { key?: string } | null;
    const key = data?.key?.trim() ?? "";
    return usableSecret(key) ? key : "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    console.error("stripe-secret", message);
    return "";
  }
}

export async function stripeClient() {
  const key = cachedKey || await projectStripeKey();
  if (!usableSecret(key)) return null;
  cachedKey = key;
  return new Stripe(key);
}

export async function stripeWebhookSecret() {
  return vaultSecret("read_stripe_webhook_secret");
}
