import { NextResponse } from "next/server";
import { z } from "zod";
import { previewPromo } from "@/lib/promo/preview";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  code: z.string().trim().max(40),
  subtotal: z.number().min(0).max(100000),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That promo code could not be checked." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Promo codes are not available right now." }, { status: 503 });
  const supabase = await createClient();
  const preview = await previewPromo(supabase, parsed.data.code, parsed.data.subtotal);
  if ("error" in preview) return NextResponse.json({ error: preview.error }, { status: 400 });
  return NextResponse.json(preview);
}
