import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCartShipping } from "@/lib/shipping/quote";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  productIds: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
  promoCode: z.string().trim().max(40).optional(),
  subtotal: z.number().min(0).max(100000).optional(),
});

async function previewPromo(code: string, subtotal: number) {
  if (!code.trim() || !isServiceRoleConfigured()) return { discount: 0 };
  const admin = createAdminClient();
  const found = await admin.from("promo_codes").select("kind, amount, starts_on, ends_on, max_uses, used_count, enabled").eq("code", code.trim().toUpperCase()).maybeSingle();
  const row = found.data;
  if (!row || !row.enabled) return { discount: 0, promoError: "That promo code is not available." };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  if ((row.starts_on && today < row.starts_on) || (row.ends_on && today > row.ends_on) || (row.max_uses !== null && row.used_count >= row.max_uses)) {
    return { discount: 0, promoError: "That promo code is not available." };
  }
  const amount = Number(row.amount);
  const discount = row.kind === "percent" ? Math.round(subtotal * amount) / 100 : Math.min(amount, subtotal);
  return { discount: Math.round(Math.min(discount, subtotal) * 100) / 100 };
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The cart could not be checked." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Shipping options are not available right now." }, { status: 503 });
  const supabase = await createClient();
  const quoted = await quoteCartShipping(supabase, parsed.data.productIds);
  if ("error" in quoted) return NextResponse.json({ error: quoted.error }, { status: 400 });
  const promo = await previewPromo(parsed.data.promoCode ?? "", parsed.data.subtotal ?? 0);
  return NextResponse.json({ options: quoted.options, ...promo });
}
