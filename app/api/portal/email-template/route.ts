import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { orderEmailDefaults, passwordEmailDefaults, passwordEmailFrom, type PasswordEmailTemplate } from "@/lib/mail/template";
import { resendConfigured } from "@/lib/mail/send";

const templateIds = ["password_reset", "order_confirmation"] as const;
type TemplateId = (typeof templateIds)[number];

const defaults: Record<TemplateId, PasswordEmailTemplate> = {
  password_reset: passwordEmailDefaults,
  order_confirmation: orderEmailDefaults,
};

const saveSchema = z.object({
  id: z.enum(templateIds).optional(),
  subject: z.string().trim().min(1).max(160),
  heading: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  buttonLabel: z.string().trim().min(1).max(80),
  footer: z.string().trim().min(1).max(400),
});

function templateId(value: string | null): TemplateId {
  return value === "order_confirmation" ? "order_confirmation" : "password_reset";
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
  }
  const id = templateId(new URL(request.url).searchParams.get("id"));
  const fallback = defaults[id];
  const admin = createAdminClient();
  const template = await admin
    .from("email_templates")
    .select("subject, heading, body, button_label, footer")
    .eq("id", id)
    .maybeSingle();
  const row = template.data;
  return NextResponse.json({
    template: {
      fromName: passwordEmailFrom.name,
      fromEmail: passwordEmailFrom.email,
      subject: row?.subject ?? fallback.subject,
      heading: row?.heading ?? fallback.heading,
      body: row?.body ?? fallback.body,
      buttonLabel: row?.button_label ?? fallback.buttonLabel,
      footer: row?.footer ?? fallback.footer,
    },
    resend: { configured: await resendConfigured() },
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
  }
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the email template fields." }, { status: 400 });
  const body = parsed.data;
  const id = body.id ?? "password_reset";
  const admin = createAdminClient();
  const result = await admin.from("email_templates").upsert({
    id,
    from_name: passwordEmailFrom.name,
    from_email: passwordEmailFrom.email,
    subject: body.subject,
    heading: body.heading,
    body: body.body,
    button_label: body.buttonLabel,
    footer: body.footer,
    updated_at: new Date().toISOString(),
  });
  if (result.error) return NextResponse.json({ error: "The email template could not be saved." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: id === "order_confirmation" ? "save_order_email" : "save_password_email",
    p_entity: "email_templates",
    p_entity_id: id,
    p_detail: { from: passwordEmailFrom.email, subject: body.subject },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
