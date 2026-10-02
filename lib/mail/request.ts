import { sendNoticeEmail } from "@/lib/mail/notice";
import { passwordEmailFrom } from "@/lib/mail/template";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export async function sendStockRequestEmail(input: {
  name: string;
  email: string;
  productName: string;
  sku: string;
  note: string;
}) {
  let to = passwordEmailFrom.email;
  if (isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const settings = await admin.from("site_settings").select("email").eq("id", 1).maybeSingle();
    to = settings.data?.email || to;
  }
  if (!to.includes("@")) return false;
  return sendNoticeEmail({
    id: "stock_request",
    to,
    values: {
      name: input.name,
      email: input.email,
      product: input.productName,
      sku: input.sku || "—",
      note: input.note,
    },
    buttonLink: input.email.includes("@") ? `mailto:${input.email}` : "",
    replyTo: input.email,
  });
}
