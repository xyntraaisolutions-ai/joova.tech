import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyStockChange } from "@/lib/portal/stock-mail";

type Commerce = Record<string, unknown>;

export function availableUnits(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

export async function readAvailable(supabase: SupabaseClient, productId: string) {
  const { data } = await supabase
    .from("inventory")
    .select("on_hand, reserved")
    .eq("product_id", productId)
    .is("variant_id", null)
    .eq("warehouse", "US")
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return 0;
  return availableUnits(data.on_hand, data.reserved);
}

async function writeAvailability(supabase: SupabaseClient, productId: string, availability: "in_stock" | "out_of_stock") {
  const { data } = await supabase.from("products").select("commerce").eq("id", productId).maybeSingle();
  const commerce = (data?.commerce ?? {}) as Commerce;
  if (commerce.availability === availability) return;
  await supabase.from("products").update({ commerce: { ...commerce, availability } }).eq("id", productId);
}

export async function syncAvailability(supabase: SupabaseClient, productId: string, previousAvailable: number) {
  const available = await readAvailable(supabase, productId);
  await notifyStockChange(productId, previousAvailable, available);
  if (available <= 0) {
    await writeAvailability(supabase, productId, "out_of_stock");
    return;
  }
  if (previousAvailable <= 0) await writeAvailability(supabase, productId, "in_stock");
}
