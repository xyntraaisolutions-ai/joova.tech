import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { passwordEmailFrom, escapeHtml } from "@/lib/mail/template";
import { resendKey } from "@/lib/mail/send";

export async function sendStockRequestEmail(input: {
  name: string;
  email: string;
  productName: string;
  sku: string;
  note: string;
}) {
  if (!isServiceRoleConfigured()) return false;
  const admin = createAdminClient();
  const settings = await admin.from("site_settings").select("email").eq("id", 1).maybeSingle();
  const supportEmail = settings.data?.email || passwordEmailFrom.email;
  const key = await resendKey();
  if (!key || !supportEmail.includes("@")) return false;
  const subject = `Customer request: ${input.productName}`;
  const text = [
    `${input.name} requested an out-of-stock item.`,
    "",
    `Product: ${input.productName}`,
    input.sku ? `SKU: ${input.sku}` : "",
    `Email: ${input.email}`,
    "",
    input.note,
  ].filter((line) => line !== "").join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:22px">Customer request</h1><p>${escapeHtml(input.name)} requested an out-of-stock item.</p><p><strong>${escapeHtml(input.productName)}</strong>${input.sku ? `<br>SKU ${escapeHtml(input.sku)}` : ""}</p><p>Reply to ${escapeHtml(input.email)}</p><p>${escapeHtml(input.note).replaceAll("\n", "<br>")}</p></div>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${passwordEmailFrom.name} <${passwordEmailFrom.email}>`,
        to: [supportEmail],
        reply_to: input.email,
        subject,
        text,
        html,
      }),
    });
    if (!response.ok) console.error("resend", response.status);
    return response.ok;
  } catch (error) {
    console.error("resend", error instanceof Error ? error.message : "send failed");
    return false;
  }
}
