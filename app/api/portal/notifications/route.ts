import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";

type PortalClient = SupabaseClient;

const kinds = ["order", "return", "warranty"] as const;

const saveSchema = z.object({
  action: z.literal("save"),
  id: z.uuid().optional(),
  kind: z.enum(kinds),
  fullName: z.string().trim().min(1).max(80),
  email: z.email(),
  phone: z.string().trim().max(30).default(""),
  role: z.string().trim().min(1).max(60),
  emailEnabled: z.boolean(),
}).refine((body) => body.phone === "" || /^[+\d\s().-]{7,30}$/.test(body.phone), {
  path: ["phone"],
  message: "Enter a phone number, or leave it blank.",
});

const deleteSchema = z.object({
  action: z.literal("delete"),
  id: z.uuid(),
});

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const listed = await gate.session.supabase
    .from("notification_recipients")
    .select("id, kind, full_name, email, phone, role_label, email_enabled, created_at")
    .is("deleted_at", null)
    .order("created_at");
  if (listed.error) {
    console.error("notification list", listed.error.code, listed.error.message);
    return NextResponse.json({ error: "Notifications could not be loaded." }, { status: 400 });
  }
  return NextResponse.json({ recipients: listed.data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const json = await request.json().catch(() => null);
  const action = json && typeof json === "object" && "action" in json ? String(json.action) : "";
  if (action === "delete") return remove(deleteSchema.safeParse(json), gate.session.supabase, gate.viewAs);
  if (action === "save") return save(saveSchema.safeParse(json), gate.session.supabase, gate.viewAs);
  return NextResponse.json({ error: "Check the recipient fields." }, { status: 400 });
}

async function save(
  parsed: ReturnType<typeof saveSchema.safeParse>,
  supabase: PortalClient,
  viewAs: string,
) {
  if (!parsed.success) {
    const phone = parsed.error.issues.some((issue) => issue.path.includes("phone"));
    return NextResponse.json({ error: phone ? "Enter a phone number, or leave it blank." : "Check the name, email, and role." }, { status: 400 });
  }
  const row = {
    kind: parsed.data.kind,
    full_name: parsed.data.fullName,
    email: parsed.data.email.trim().toLowerCase(),
    phone: parsed.data.phone,
    role_label: parsed.data.role,
    email_enabled: parsed.data.emailEnabled,
    sms_enabled: false,
  };
  const result = parsed.data.id
    ? await supabase.from("notification_recipients").update(row).eq("id", parsed.data.id).is("deleted_at", null)
    : await supabase.from("notification_recipients").insert(row);
  if (result.error) {
    const duplicate = result.error.code === "23505";
    return NextResponse.json({ error: duplicate ? "That email is already on this list." : "The recipient could not be saved." }, { status: 400 });
  }
  await supabase.rpc("record_audit", {
    p_action: "save_notification",
    p_entity: "notification_recipients",
    p_entity_id: parsed.data.id ?? parsed.data.email,
    p_detail: { kind: parsed.data.kind, email: row.email, emailEnabled: row.email_enabled },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}

async function remove(
  parsed: ReturnType<typeof deleteSchema.safeParse>,
  supabase: PortalClient,
  viewAs: string,
) {
  if (!parsed.success) return NextResponse.json({ error: "That recipient was not found." }, { status: 400 });
  const result = await supabase.from("notification_recipients").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (result.error) return NextResponse.json({ error: "The recipient could not be removed." }, { status: 400 });
  await supabase.rpc("record_audit", {
    p_action: "delete_notification",
    p_entity: "notification_recipients",
    p_entity_id: parsed.data.id,
    p_detail: {},
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
