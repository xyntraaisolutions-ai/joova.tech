import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  message: z.string().trim().min(3).max(4000),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isSupabaseConfigured()) {
    return NextResponse.json({ saved: false });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_contact", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_message: parsed.data.message,
  });
  if (error || !data || data.ok !== true) {
    return NextResponse.json({ saved: false });
  }
  return NextResponse.json({ saved: true });
}
