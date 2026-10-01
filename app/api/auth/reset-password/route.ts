import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a password of at least 8 characters." },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Password reset is not available." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { error: "This reset link is missing or has expired. Request a new one." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("different")) {
      return NextResponse.json(
        { error: "Choose a password that is different from the current one." },
        { status: 400 },
      );
    }
    console.error("updateUser password", error.message);
    return NextResponse.json(
      { error: "The password could not be saved. Request a new reset link and try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
