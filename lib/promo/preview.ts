import type { SupabaseClient } from "@supabase/supabase-js";

export type PromoPreview =
  | { ok: true; discount: number; code?: string }
  | { ok: false; reason: "invalid" | "expired" | "not_yet" };

export async function previewPromo(supabase: SupabaseClient, code: string, subtotal: number): Promise<PromoPreview | { error: string }> {
  const { data, error } = await supabase.rpc("preview_promo", { p_code: code, p_subtotal: subtotal });
  if (error || !data || typeof data !== "object") return { error: "That promo code could not be checked." };
  const body = data as { ok?: boolean; discount?: number; code?: string; reason?: string };
  if (body.ok) return { ok: true, discount: Number(body.discount ?? 0), code: body.code };
  const reason = body.reason === "expired" || body.reason === "not_yet" ? body.reason : "invalid";
  return { ok: false, reason };
}
