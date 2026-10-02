import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { alertStaff } from "@/lib/mail/staff-alert";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  order: z.string().trim().min(1).max(40),
  email: z.email(),
  reason: z.string().trim().min(3).max(2000),
  resolution: z.enum(["refund", "exchange"]),
});
const replySchema = z.object({
  action: z.literal("reply"),
  id: z.uuid(),
  note: z.string().trim().min(3).max(2000),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const reply = replySchema.safeParse(json);
  if (reply.success) {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "Returns are saved after Supabase is connected. Email support until then." });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("customer_add_return_info", {
      p_id: reply.data.id,
      p_note: reply.data.note,
    });
    if (error) return NextResponse.json({ ok: false, error: "The return could not be updated." }, { status: 500 });
    const body = data as { ok?: boolean; error?: string } | null;
    if (!body?.ok) return NextResponse.json({ ok: false, error: body?.error ?? "The return could not be updated." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter the order number, email, a reason, and whether you want a refund or an exchange." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Returns are saved after Supabase is connected. Email support until then." });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_return", {
    p_order: parsed.data.order,
    p_email: parsed.data.email,
    p_reason: parsed.data.reason,
    p_resolution: parsed.data.resolution,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: "The return could not be started." }, { status: 500 });
  }
  const body = data as { ok?: boolean } | null;
  if (body?.ok) {
    await alertStaff({ kind: "return", orderId: parsed.data.order, email: parsed.data.email });
  }
  return NextResponse.json(data);
}
