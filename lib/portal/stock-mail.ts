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
  const rule = await admin.from("inventory_low_stock").select("enabled, threshold, notify, watcher_emails").eq("product_id", productId).maybeSingle();
  const watch = rule.data as { enabled?: boolean; threshold?: number; notify?: boolean; watcher_emails?: string[] } | null;
  const threshold = watch?.threshold ?? LOW_STOCK_UNITS;
  if (watch?.enabled && watch.notify && previous > threshold && available <= threshold) {
    const watchers = [...new Set((watch.watcher_emails ?? []).map((email: string) => email.trim().toLowerCase()).filter((email: string) => email.includes("@")))];
    if (!watchers.length) {
      await sendLowStockEmail({ productName: name, sku, available });
    } else {
      for (const to of watchers) await sendLowStockEmail({ productName: name, sku, available, to });
    }
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
