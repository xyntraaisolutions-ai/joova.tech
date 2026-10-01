import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.union([
  z.object({ code: z.string().trim().min(8).max(2048) }),
  z.object({
    tokenHash: z.string().trim().min(8).max(2048),
    type: z.literal("recovery"),
  }),
]);

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Password reset is not available." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "This reset link is missing or has expired." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } =
    "code" in parsed.data
      ? await supabase.auth.exchangeCodeForSession(parsed.data.code)
      : await supabase.auth.verifyOtp({ type: "recovery", token_hash: parsed.data.tokenHash });

  if (error) {
    return NextResponse.json(
      { error: "This reset link is missing or has expired. Request a new one." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
