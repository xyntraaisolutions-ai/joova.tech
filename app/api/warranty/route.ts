import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  order: z.string().trim().min(1).max(40),
  serial: z.string().trim().max(80).optional(),
  message: z.string().trim().min(3).max(4000),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ saved: false }, { status: 400 });
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
    return NextResponse.json({ saved: false });
  }
  return NextResponse.json({ saved: true });
}
