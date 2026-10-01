import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchCatalogProductId, productIdFromCart } from "@/lib/content/helpers";
import { purchaseText } from "@/lib/content/variants";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe/server";
import { isShippingCode } from "@/lib/shipping/options";
import { quoteCartShipping } from "@/lib/shipping/quote";
import { quoteSalesTax } from "@/lib/tax/quote";

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
  }),
  shippingOption: z.string().trim().min(1).max(40),
  promoCode: z.string().trim().max(40).optional(),
});

function cents(price: number | string) {
  return Math.round(Number(price) * 100);
}

function applyDiscount(subtotal: number, tax: number, discount: number) {
  const off = Math.min(Math.max(discount, 0), subtotal);
  const ratio = subtotal > 0 ? (subtotal - off) / subtotal : 1;
  const taxed = Math.round(tax * ratio * 100) / 100;
  return { discount: Math.round(off * 100) / 100, tax: taxed };
}

async function promoDiscount(admin: ReturnType<typeof createAdminClient>, code: string, subtotal: number) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { code: null as string | null, discount: 0 };
  const found = await admin.from("promo_codes").select("code, kind, amount, starts_on, ends_on, max_uses, used_count, enabled").eq("code", trimmed).maybeSingle();
  const row = found.data;
  if (found.error || !row || !row.enabled) return { error: "That promo code is not available." };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  if (row.starts_on && today < row.starts_on) return { error: "That promo code is not available yet." };
  if (row.ends_on && today > row.ends_on) return { error: "That promo code has ended." };
  if (row.max_uses !== null && row.used_count >= row.max_uses) return { error: "That promo code has been used up." };
  const amount = Number(row.amount);
  const discount = row.kind === "percent" ? Math.round(subtotal * amount) / 100 : Math.min(amount, subtotal);
  return { code: row.code as string, discount };
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the email, ship-to address, and cart." }, { status: 400 });
  }
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
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

  const admin = createAdminClient();
  const stripe = await stripeClient();
  const saved = await admin.from("order_items").select("name, quantity, price, color, selection, product_id").eq("order_id", order.orderId);
  if (!stripe || saved.error || !saved.data?.length) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: stripe ? "The cart could not be checked out." : "Payment is not ready yet." }, { status: 503 });
  }

  const quoted = await quoteSalesTax(supabase, {
    region: parsed.data.shipping.region,
    postal: parsed.data.shipping.postal,
    items: saved.data.map((item) => ({ productId: item.product_id, quantity: item.quantity })),
  });
  if (!quoted.ok) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: quoted.error }, { status: 400 });
  }
  const offered = await quoteCartShipping(supabase, saved.data.map((item) => item.product_id));
  if ("error" in offered) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: offered.error }, { status: 400 });
  }
  if (!isShippingCode(parsed.data.shippingOption)) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: "Choose a shipping option." }, { status: 400 });
  }
  const chosen = offered.options.find((option) => option.code === parsed.data.shippingOption);
  if (!chosen) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: "That shipping option is not available for this cart." }, { status: 400 });
  }
  const promo = await promoDiscount(admin, parsed.data.promoCode ?? "", quoted.quote.subtotal);
  if ("error" in promo) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: promo.error }, { status: 400 });
  }
  const priced = applyDiscount(quoted.quote.subtotal, quoted.quote.tax, promo.discount);
  const taxCents = Math.round(priced.tax * 100);
  const shippingCents = Math.round(chosen.price * 100);
  const taxed = await admin.from("orders").update({
    tax_percent: quoted.quote.percent,
    tax_amount: priced.tax,
    shipping_amount: chosen.price,
    shipping_code: chosen.code,
    shipping_name: chosen.name,
    discount_amount: priced.discount,
    promo_code: promo.code,
  }).eq("id", order.orderId);
  if (taxed.error) {
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: "Sales tax could not be added to this order." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  try {
    let coupon: string | undefined;
    if (priced.discount > 0) {
      const created = await stripe.coupons.create({
        amount_off: Math.round(priced.discount * 100),
        currency: "usd",
        duration: "once",
        max_redemptions: 1,
        name: promo.code ?? "Discount",
      });
      coupon = created.id;
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: order.orderId,
      metadata: { orderId: order.orderId },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Joova order ${order.orderId}`,
          metadata: { orderId: order.orderId },
          footer: "Joova Tech LLC · Grapevine, Texas",
        },
      },
      success_url: `${origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      branding_settings: {
        display_name: "Joova",
        background_color: "#F4F4F2",
        button_color: "#FF5A05",
        border_style: "pill",
        font_family: "inter",
      },
      custom_text: {
        submit: {
          message: "Secure payment via Stripe. Joova does not store your card number.",
        },
      },
      ...(coupon ? { discounts: [{ coupon }] } : {}),
      line_items: [
        ...saved.data.map((item) => {
          const detail = purchaseText(
            item.selection as { color?: string; type?: string; size?: string; custom?: string; sku?: string } | null,
            item.color ?? undefined,
          );
          return {
            quantity: item.quantity,
            price_data: {
              currency: "usd",
              unit_amount: cents(item.price),
              product_data: {
                name: item.name,
                ...(detail ? { description: detail.slice(0, 400) } : {}),
              },
            },
          };
        }),
        ...(taxCents > 0
          ? [{
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: taxCents,
                product_data: {
                  name: `Sales tax (${quoted.quote.label})`,
                  description: `${quoted.quote.regionName} · ${parsed.data.shipping.region.toUpperCase()} ${parsed.data.shipping.postal.slice(0, 5)}`.slice(0, 400),
                },
              },
            }]
          : []),
        ...(shippingCents > 0
          ? [{
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: shippingCents,
                product_data: {
                  name: chosen.name,
                  description: `${chosen.minDays} to ${chosen.maxDays} days`.slice(0, 400),
                },
              },
            }]
          : []),
      ],
    });
    if (!session.url) throw new Error("missing url");
    const attached = await admin.rpc("attach_checkout_session", {
      p_order: order.orderId,
      p_token: order.token,
      p_session: session.id,
    });
    const attachedBody = attached.data as { ok?: boolean } | null;
    if (attached.error || attachedBody?.ok !== true) throw new Error("attach");
    return NextResponse.json({ url: session.url, orderId: order.orderId, token: order.token });
  } catch (error) {
    console.error("stripe-checkout", error instanceof Error ? error.message : "failed");
    await supabase.rpc("release_checkout", { p_order: order.orderId, p_token: order.token });
    return NextResponse.json({ error: "Payment could not be started. Nothing was charged." }, { status: 400 });
  }
}
