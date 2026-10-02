import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Profile edits open when the account service is connected." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const { error } = await supabase.from("profiles").update({ name: parsed.data.name }).eq("id", data.user.id);
  if (error) return NextResponse.json({ error: "The name could not be saved." }, { status: 400 });
  return NextResponse.json({ ok: true, name: parsed.data.name });
}
