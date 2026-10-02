import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { alertStaff } from "@/lib/mail/staff-alert";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  order: z.string().trim().min(1).max(40),
  serial: z.string().trim().max(80).optional(),
  message: z.string().trim().min(3).max(4000),
});
const deviceSchema = z.object({
  registrationId: z.uuid(),
  message: z.string().trim().min(3).max(4000),
});
const replySchema = z.object({
  action: z.literal("reply"),
  id: z.uuid(),
  note: z.string().trim().min(3).max(2000),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const device = deviceSchema.safeParse(json);
  const reply = replySchema.safeParse(json);
  if (device.success || reply.success) {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "Sign in to start a warranty claim." }, { status: 503 });
    }
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "Sign in to start a warranty claim." }, { status: 401 });
    }
    const result = reply.success
      ? await supabase.rpc("customer_add_claim_info", { p_id: reply.data.id, p_note: reply.data.note })
      : await supabase.rpc("customer_start_warranty_claim", {
          p_registration: device.success ? device.data.registrationId : "",
          p_message: device.success ? device.data.message : "",
        });
    const body = result.data as { ok?: boolean; error?: string; already?: boolean; id?: string } | null;
    if (result.error || !body?.ok) {
      return NextResponse.json({ ok: false, saved: false, error: body?.error ?? "The claim could not be started." }, { status: 400 });
    }
    if (!reply.success && body.already !== true && body.id) {
      await alertStaff({ kind: "warranty", id: body.id, orderId: "" });
    }
    return NextResponse.json({ ok: true, saved: true, already: body.already === true });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ saved: false, error: "Enter your name, email, order number, and what happened." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ saved: false });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_warranty_claim", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_order: parsed.data.order,
    p_serial: parsed.data.serial ?? "",
    p_message: parsed.data.message,
  });
  if (error || !data || data.ok !== true) {
    return NextResponse.json({ saved: false, error: data?.error ?? "The claim could not be started." }, { status: 400 });
  }
  await alertStaff({ kind: "warranty", orderId: parsed.data.order, email: parsed.data.email });
  return NextResponse.json({ saved: true });
}
