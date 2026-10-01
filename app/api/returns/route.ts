import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  order: z.string().trim().min(1).max(40),
  email: z.email(),
  reason: z.string().trim().min(3).max(2000),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter the order number, email, and a reason." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Returns are saved after Supabase is connected. Email support until then." });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_return", {
    p_order: parsed.data.order,
    p_email: parsed.data.email,
    p_reason: parsed.data.reason,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: "The return could not be started." }, { status: 500 });
  }
  return NextResponse.json(data);
}
