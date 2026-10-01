import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  order: z.string().trim().min(1).max(40),
  email: z.email(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the order number and email." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Tracking goes live after the first shipments." });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("track_order", {
    p_order: parsed.data.order,
    p_email: parsed.data.email,
  });
  if (error) {
    return NextResponse.json({ error: "Tracking could not be loaded." }, { status: 500 });
  }
  return NextResponse.json(data);
}
