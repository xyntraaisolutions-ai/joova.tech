import { createAdminClient, isServiceRoleConfigured, serviceRoleKey } from "@/lib/supabase/admin";
import { supabaseUrl } from "@/lib/supabase/env";
import { callProjectFunction } from "@/lib/portal/super-admin";
import { loadBrandMark, publicLogoUrl } from "@/lib/brand/logo";
import { passwordEmailDefaults, passwordEmailFrom, renderPasswordEmail } from "@/lib/mail/template";

type FunctionMail = {
  ok: boolean;
  configured?: boolean;
  error?: string;
  missingFunction?: boolean;
};

export async function resendKey() {
  if (!isServiceRoleConfigured()) return "";
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("read_resend_key");
  if (error || typeof data !== "string") return "";
  return data.trim();
}

async function callMailFunction(body: Record<string, unknown>): Promise<FunctionMail> {
  if (body.probe === true) {
    const ready = await callProjectFunction({ action: "ready" });
    if (!ready.missingFunction) return { ok: ready.resend === true, configured: ready.resend === true };
  }
  const internal = await callProjectFunction({
    action: "send-reset",
    to: body.to,
    subject: body.subject,
    text: body.text,
    html: body.html,
    ...(Array.isArray(body.attachments) ? { attachments: body.attachments } : {}),
  });
  if (!internal.missingFunction && body.probe !== true) {
    if (internal.ok === true) return { ok: true };
    console.error("resend-function", internal.error ?? "send");
    if (internal.error === "rejected") {
      return { ok: false, error: "Resend has not accepted support@joova.tech yet. Verify that sender in Resend, then try again." };
    }
    if (internal.error === "missing") return { ok: false, error: "The Resend key is not stored yet." };
    return { ok: false, error: "The reset email could not be sent." };
  }
  if (!isServiceRoleConfigured() || !supabaseUrl()) return { ok: false, error: "The Resend key is not stored yet." };
  try {
    const response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/send-password-reset`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey()}`,
        apikey: serviceRoleKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.status === 404) return { ok: false, missingFunction: true, error: "The Resend key is not stored yet." };
    const data = (await response.json().catch(() => null)) as { ok?: boolean; configured?: boolean; error?: string } | null;
    if (body.probe === true) return { ok: response.ok && data?.configured === true, configured: data?.configured === true };
    if (!response.ok || data?.ok !== true) {
      console.error("resend-function", response.status, data?.error ?? "");
      if (data?.error === "rejected") {
        return { ok: false, error: "Resend has not accepted support@joova.tech yet. Verify that sender in Resend, then try again." };
      }
      if (data?.error === "missing") return { ok: false, error: "The Resend key is not stored yet." };
      return { ok: false, error: "The reset email could not be sent." };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error("resend-function", message);
    return { ok: false, error: "The reset email could not be sent." };
  }
}

export async function resendConfigured() {
  if (!isServiceRoleConfigured()) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("resend_key_configured");
  if (!error && data === true) return true;
  const probe = await callMailFunction({ probe: true });
  return probe.configured === true;
}

export async function loadPasswordEmail() {
  const template = { ...passwordEmailDefaults, fromName: passwordEmailFrom.name, fromEmail: passwordEmailFrom.email };
  let supportEmail = passwordEmailFrom.email;
  let siteUrl = "";
  let brand = "Joova";
  if (!isServiceRoleConfigured()) return { template, supportEmail, siteUrl, brand };
  const admin = createAdminClient();
  const [savedTemplate, settings] = await Promise.all([
    admin.from("email_templates").select("subject, heading, body, button_label, footer").eq("id", "password_reset").maybeSingle(),
    admin.from("site_settings").select("email, site_url, brand").eq("id", 1).maybeSingle(),
  ]);
  const row = savedTemplate.data;
  if (row) {
    template.subject = row.subject || template.subject;
    template.heading = row.heading || template.heading;
    template.body = row.body || template.body;
    template.buttonLabel = row.button_label || template.buttonLabel;
    template.footer = row.footer || template.footer;
  }
  supportEmail = settings.data?.email || passwordEmailFrom.email;
  siteUrl = settings.data?.site_url || "";
  brand = settings.data?.brand || "Joova";
  return { template, supportEmail, siteUrl, brand };
}

export async function sendPasswordResetEmail(input: {
  origin: string;
  to: string;
  name: string;
  resetLink: string;
}) {
  const loaded = await loadPasswordEmail();
  const supportEmail = loaded.supportEmail || passwordEmailFrom.email;
  const siteUrl = (loaded.siteUrl || input.origin).replace(/\/$/, "");
  const mark = await loadBrandMark();
  const logoUrl = mark.logo ? publicLogoUrl(mark.logo.url, siteUrl) : "";
  const rendered = renderPasswordEmail(
    loaded.template,
    {
      email: input.to,
      name: input.name || "there",
      reset_link: input.resetLink,
      support_email: supportEmail,
      site_name: loaded.brand || "Joova",
    },
    logoUrl && mark.logo ? { url: logoUrl, width: mark.logo.width, height: mark.logo.height } : null,
  );
  const mailed = await callMailFunction({
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
  if (mailed.ok) return { ok: true as const, fromEmail: passwordEmailFrom.email };
  if (!mailed.missingFunction) return { ok: false as const, error: mailed.error ?? "The reset email could not be sent." };

  const key = await resendKey();
  if (!key) return { ok: false as const, error: "The Resend key is not stored yet." };
  const from = `${passwordEmailFrom.name} <${passwordEmailFrom.email}>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: passwordEmailFrom.email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      }),
    });
    if (!response.ok) {
      console.error("resend", response.status);
      return { ok: false as const, error: "The reset email could not be sent." };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error("resend", message);
    return { ok: false as const, error: "The reset email could not be sent." };
  }
  return { ok: true as const, fromEmail: passwordEmailFrom.email };
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}) {
  const mailed = await callMailFunction({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
  });
  if (mailed.ok) return true;
  if (!mailed.missingFunction) return false;

  const key = await resendKey();
  if (!key) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${passwordEmailFrom.name} <${passwordEmailFrom.email}>`,
        to: [input.to],
        reply_to: passwordEmailFrom.email,
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(input.attachments?.length ? { attachments: input.attachments } : {}),
      }),
    });
    if (!response.ok) {
      console.error("resend", response.status);
      return false;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error("resend", message);
    return false;
  }
  return true;
}
