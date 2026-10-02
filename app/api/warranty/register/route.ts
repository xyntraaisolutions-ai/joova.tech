import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  order: z.string().trim().min(1).max(40),
  productId: z.string().trim().min(1).max(40),
  serial: z.string().trim().max(80).optional(),
});

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Warranty registration is saved after Supabase is connected." });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Choose an order and product to register." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_warranty", {
    p_order: parsed.data.order,
    p_product: parsed.data.productId,
    p_serial: parsed.data.serial ?? "",
  });
  if (error) {
    return NextResponse.json({ ok: false, error: "The product could not be registered." }, { status: 500 });
  }
  return NextResponse.json(data);
}
