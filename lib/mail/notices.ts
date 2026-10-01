import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { escapeHtml, passwordEmailFrom } from "@/lib/mail/template";
import { sendTransactionalEmail } from "@/lib/mail/send";

function page(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:22px">${escapeHtml(title)}</h1>${body}</div>`;
}

async function supportAddress() {
  if (!isServiceRoleConfigured()) return passwordEmailFrom.email;
  const admin = createAdminClient();
  const settings = await admin.from("site_settings").select("email").eq("id", 1).maybeSingle();
  return settings.data?.email || passwordEmailFrom.email;
}

export async function sendLowStockEmail(input: { productName: string; sku: string; available: number }) {
  const to = await supportAddress();
  const subject = `Low stock: ${input.productName}`;
  const text = [
    `${input.productName} is down to ${input.available} available.`,
    input.sku ? `SKU: ${input.sku}` : "",
    "Available is on hand minus reserved.",
  ].filter(Boolean).join("\n");
  return sendTransactionalEmail({
    to,
    subject,
    text,
    html: page(subject, `<p>${escapeHtml(input.productName)} is down to ${input.available} available.${input.sku ? `<br>SKU ${escapeHtml(input.sku)}` : ""}</p>`),
  });
}

export async function sendBackInStockEmail(input: { email: string; name: string; productName: string; href: string }) {
  const link = input.href.startsWith("http") ? input.href : `https://joova.tech${input.href.startsWith("/") ? input.href : `/${input.href}`}`;
  const subject = `${input.productName} is available again`;
  const text = [`Hi ${input.name},`, "", `${input.productName} is back in stock.`, link].join("\n");
  return sendTransactionalEmail({
    to: input.email,
    subject,
    text,
    html: page(subject, `<p>Hi ${escapeHtml(input.name)},</p><p>${escapeHtml(input.productName)} is back in stock.</p><p><a href="${escapeHtml(link)}">View this item</a></p>`),
  });
}

export async function sendReviewRequestEmail(input: { email: string; orderId: string }) {
  const link = `https://joova.tech/reviews?order=${encodeURIComponent(input.orderId)}`;
  const subject = `How was order ${input.orderId}?`;
  const text = [
    `Order ${input.orderId} was delivered.`,
    "If you would like to share a review, send it from the reviews page. We publish a review after we read it.",
    link,
  ].join("\n");
  return sendTransactionalEmail({
    to: input.email,
    subject,
    text,
    html: page(subject, `<p>Order ${escapeHtml(input.orderId)} was delivered.</p><p>If you would like to share a review, send it from the reviews page. We publish a review after we read it.</p><p><a href="${escapeHtml(link)}">Write a review</a></p>`),
  });
}
