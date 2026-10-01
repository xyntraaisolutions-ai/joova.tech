import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { sendBackInStockEmail, sendLowStockEmail } from "@/lib/mail/notices";

export const LOW_STOCK_UNITS = 5;

export async function notifyStockChange(productId: string, previous: number, available: number) {
  if (!isServiceRoleConfigured()) return;
  const admin = createAdminClient();
  const product = await admin.from("products").select("name, sku, href").eq("id", productId).maybeSingle();
  if (!product.data) return;
  const name = product.data.name || productId;
  const sku = product.data.sku ?? "";

  if (previous > LOW_STOCK_UNITS && available <= LOW_STOCK_UNITS) {
    await sendLowStockEmail({ productName: name, sku, available });
  }

  if (previous > 0 || available <= 0) return;
  const waiting = await admin
    .from("contact_messages")
    .select("id, email, name")
    .eq("kind", "customer_request")
    .eq("product_id", productId)
    .is("notified_at", null)
    .is("deleted_at", null);
  for (const row of waiting.data ?? []) {
    if (!row.email) continue;
    const sent = await sendBackInStockEmail({
      email: row.email,
      name: row.name || "there",
      productName: name,
      href: product.data.href || `/shop`,
    });
    if (sent) {
      await admin.from("contact_messages").update({ notified_at: new Date().toISOString() }).eq("id", row.id);
    }
  }
}
