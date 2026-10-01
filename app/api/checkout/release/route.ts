import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  orderId: z.string().trim().min(1).max(40),
  token: z.string().trim().min(8).max(80),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That checkout could not be found." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("release_checkout", {
    p_order: parsed.data.orderId,
    p_token: parsed.data.token,
  });
  const body = data as { ok?: boolean; error?: string } | null;
  if (error || body?.ok !== true) {
    return NextResponse.json({ error: body?.error ?? "That checkout could not be released." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
