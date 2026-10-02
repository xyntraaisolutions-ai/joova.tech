import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startCheckoutPayment } from "@/lib/checkout/pay";
import { matchCatalogProductId, productIdFromCart } from "@/lib/content/helpers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const selectionSchema = z.object({
  color: z.string().trim().max(80).optional(),
  type: z.string().trim().max(80).optional(),
  size: z.string().trim().max(80).optional(),
  custom: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(40).optional(),
  labels: z.object({
    color: z.string().trim().max(40).optional(),
    type: z.string().trim().max(40).optional(),
    size: z.string().trim().max(40).optional(),
    custom: z.string().trim().max(40).optional(),
  }).optional(),
});

const itemSchema = z.object({
  id: z.string().trim().min(1).max(200),
  productId: z.string().trim().max(40).optional(),
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(20),
  color: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(40).optional(),
  selection: selectionSchema.optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  guestEmail: z.email().optional(),
  shipping: z.object({
    name: z.string().trim().min(1).max(80),
    line1: z.string().trim().min(1).max(120),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(1).max(80),
    region: z.string().trim().length(2),
    postal: z.string().trim().min(5).max(10),
    country: z.string().trim().length(2).optional(),
  }),
  shippingOption: z.string().trim().min(1).max(40),
  promoCode: z.string().trim().max(40).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the email, ship-to address, and cart." }, { status: 400 });
  }
  if ((parsed.data.shipping.country ?? "US").toUpperCase() !== "US") {
    return NextResponse.json({ error: "Joova delivers in the United States today." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Payment is not ready yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email ?? parsed.data.guestEmail;
  if (!email) {
    return NextResponse.json({ error: "Sign in, or continue as a guest with your email." }, { status: 401 });
  }

  const listed = await supabase.from("products").select("id").eq("published", true).is("deleted_at", null);
  const productIds = (listed.data ?? []).map((product) => product.id);
  const started = await supabase.rpc("begin_checkout", {
    p_email: email,
    p_items: parsed.data.items.map((item) => {
      const guess = productIdFromCart(item);
      const productId = item.productId && productIds.includes(item.productId)
        ? item.productId
        : productIds.includes(guess) ? guess : matchCatalogProductId(item.id, productIds) ?? guess;
      return {
        productId,
        quantity: item.quantity,
        color: item.selection?.color || item.color || "",
        selection: {
          color: item.selection?.color || item.color || "",
          type: item.selection?.type || "",
          size: item.selection?.size || "",
          custom: item.selection?.custom || "",
          sku: item.selection?.sku || item.sku || "",
          labels: item.selection?.labels,
        },
      };
    }),
    p_shipping: {
      name: parsed.data.shipping.name,
      line1: parsed.data.shipping.line1,
      line2: parsed.data.shipping.line2 ?? "",
      city: parsed.data.shipping.city,
      region: parsed.data.shipping.region.toUpperCase(),
      postal: parsed.data.shipping.postal,
      country: "US",
    },
  });
  const order = started.data as { ok?: boolean; error?: string; orderId?: string; token?: string } | null;
  if (started.error || !order?.ok || !order.orderId || !order.token) {
    return NextResponse.json({ error: order?.error ?? "The cart could not be checked out." }, { status: 400 });
  }

  const startedPayment = await startCheckoutPayment({
    orderId: order.orderId,
    token: order.token,
    shippingOption: parsed.data.shippingOption,
    promoCode: parsed.data.promoCode,
    origin: new URL(request.url).origin,
  });
  if (!startedPayment.url) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: startedPayment.error ?? "Payment could not be started. Nothing was charged." }, { status: startedPayment.status });
  }
  return NextResponse.json({ url: startedPayment.url, orderId: order.orderId, token: order.token });
}
