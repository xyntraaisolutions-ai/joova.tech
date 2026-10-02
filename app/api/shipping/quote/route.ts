import { NextResponse } from "next/server";
import { z } from "zod";
import { previewPromo } from "@/lib/promo/preview";
import { quoteCartShipping } from "@/lib/shipping/quote";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  productIds: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
  promoCode: z.string().trim().max(40).optional(),
  subtotal: z.number().min(0).max(100000).optional(),
});

async function quotedPromo(supabase: Awaited<ReturnType<typeof createClient>>, code: string, subtotal: number) {
  if (!code.trim()) return { discount: 0 };
  const preview = await previewPromo(supabase, code, subtotal);
  if ("error" in preview) return { discount: 0, promoError: preview.error };
  if (!preview.ok) {
    const promoError = preview.reason === "expired"
      ? "That promo code has expired."
      : preview.reason === "not_yet"
        ? "That promo code is not available yet."
        : "That promo code is not valid.";
    return { discount: 0, promoError };
  }
  return { discount: preview.discount };
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The cart could not be checked." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Shipping options are not available right now." }, { status: 503 });
  const supabase = await createClient();
  const quoted = await quoteCartShipping(supabase, parsed.data.productIds);
  if ("error" in quoted) return NextResponse.json({ error: quoted.error }, { status: 400 });
  const promo = await quotedPromo(supabase, parsed.data.promoCode ?? "", parsed.data.subtotal ?? 0);
  return NextResponse.json({ options: quoted.options, ...promo });
}
