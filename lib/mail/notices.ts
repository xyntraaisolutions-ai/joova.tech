import { sendNoticeEmail } from "@/lib/mail/notice";
import { passwordEmailFrom } from "@/lib/mail/template";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

async function siteRoot() {
  if (!isServiceRoleConfigured()) return "https://joova.tech";
  const admin = createAdminClient();
  const settings = await admin.from("site_settings").select("site_url").eq("id", 1).maybeSingle();
  return (settings.data?.site_url || "https://joova.tech").replace(/\/$/, "");
}

async function supportAddress() {
  if (!isServiceRoleConfigured()) return passwordEmailFrom.email;
  const admin = createAdminClient();
  const settings = await admin.from("site_settings").select("email").eq("id", 1).maybeSingle();
  return settings.data?.email || passwordEmailFrom.email;
}

export async function sendLowStockEmail(input: { productName: string; sku: string; available: number; to?: string }) {
  const root = await siteRoot();
  return sendNoticeEmail({
    id: "low_stock",
    to: input.to || await supportAddress(),
    values: { product: input.productName, sku: input.sku || "—", available: String(input.available) },
    buttonLink: `${root}/portal/inventory`,
  });
}

export async function sendBackInStockEmail(input: { email: string; name: string; productName: string; href: string }) {
  const root = await siteRoot();
  const link = input.href.startsWith("http") ? input.href : `${root}${input.href.startsWith("/") ? input.href : `/${input.href}`}`;
  return sendNoticeEmail({
    id: "back_in_stock",
    to: input.email,
    values: { name: input.name, product: input.productName },
    buttonLink: link,
  });
}

export async function sendReplacementOrderEmail(input: { email: string; orderId: string; kind: "exchange" | "warranty"; sourceOrderId?: string }) {
  const root = await siteRoot();
  return sendNoticeEmail({
    id: input.kind === "warranty" ? "warranty_replacement" : "exchange_order",
    to: input.email,
    values: { order_id: input.orderId, source_order: input.sourceOrderId || "your original order" },
    buttonLink: `${root}/account?order=${encodeURIComponent(input.orderId)}`,
  });
}

export async function sendReviewRequestEmail(input: { email: string; orderId: string }) {
  const root = await siteRoot();
  return sendNoticeEmail({
    id: "review_request",
    to: input.email,
    values: { order_id: input.orderId },
    buttonLink: `${root}/reviews?order=${encodeURIComponent(input.orderId)}`,
  });
}
