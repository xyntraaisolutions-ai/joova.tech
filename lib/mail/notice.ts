import { loadBrandMark, publicLogoUrl } from "@/lib/brand/logo";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { sendTransactionalEmail } from "@/lib/mail/send";
import {
  noticeEmailDefaults,
  passwordEmailFrom,
  renderPasswordEmail,
  type NoticeEmailId,
  type PasswordEmailTemplate,
} from "@/lib/mail/template";

export async function sendNoticeEmail(input: {
  id: NoticeEmailId;
  to: string;
  values: Record<string, string>;
  buttonLink?: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
}) {
  const template: PasswordEmailTemplate = { ...noticeEmailDefaults[input.id] };
  let supportEmail: string = passwordEmailFrom.email;
  let siteUrl = "https://joova.tech";
  let brand = "Joova";
  let logo: { url: string; width: number; height: number } | null = null;
  if (isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const [saved, settings] = await Promise.all([
      admin.from("email_templates").select("subject, heading, body, button_label, footer").eq("id", input.id).maybeSingle(),
      admin.from("site_settings").select("email, site_url, brand").eq("id", 1).maybeSingle(),
    ]);
    const row = saved.data;
    if (row) {
      template.subject = row.subject || template.subject;
      template.heading = row.heading || template.heading;
      template.body = row.body || template.body;
      template.buttonLabel = row.button_label || template.buttonLabel;
      template.footer = row.footer || template.footer;
    }
    supportEmail = settings.data?.email || supportEmail;
    siteUrl = (settings.data?.site_url || siteUrl).replace(/\/$/, "");
    brand = settings.data?.brand || brand;
    const mark = await loadBrandMark();
    const logoUrl = mark.logo ? publicLogoUrl(mark.logo.url, siteUrl) : "";
    logo = logoUrl && mark.logo ? { url: logoUrl, width: mark.logo.width, height: mark.logo.height } : null;
  } else if (supabaseUrl() && supabaseAnonKey()) {
    const response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/joova-internal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey()}`,
        apikey: supabaseAnonKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "email-copy", id: input.id }),
    }).catch(() => null);
    const data = response?.ok
      ? await response.json() as {
          template?: { subject?: string; heading?: string; body?: string; button_label?: string; footer?: string } | null;
          settings?: { email?: string; site_url?: string; brand?: string } | null;
          logo?: { url?: string; width?: number; height?: number } | null;
        }
      : null;
    const row = data?.template;
    if (row) {
      template.subject = row.subject || template.subject;
      template.heading = row.heading || template.heading;
      template.body = row.body || template.body;
      template.buttonLabel = row.button_label || template.buttonLabel;
      template.footer = row.footer || template.footer;
    }
    supportEmail = data?.settings?.email || supportEmail;
    siteUrl = (data?.settings?.site_url || siteUrl).replace(/\/$/, "");
    brand = data?.settings?.brand || brand;
    const remoteLogo = data?.logo;
    const logoUrl = remoteLogo?.url ? publicLogoUrl(remoteLogo.url, siteUrl) : "";
    logo = logoUrl && remoteLogo?.width && remoteLogo.height
      ? { url: logoUrl, width: remoteLogo.width, height: remoteLogo.height }
      : null;
  }
  const rendered = renderPasswordEmail(
    template,
    {
      ...input.values,
      support_email: input.values.support_email || supportEmail,
      site_name: input.values.site_name || brand,
      reset_link: input.buttonLink || "",
    },
    logo,
  );
  return sendTransactionalEmail({
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
}
