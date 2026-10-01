import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaidOrderEmails, type PaidOrder } from "@/lib/mail/order";
import { stripeClient, stripeWebhookSecret } from "@/lib/stripe/server";

export async function POST(request: NextRequest) {
  const stripe = await stripeClient();
  const secret = await stripeWebhookSecret();
  if (!stripe || secret.length < 8) {
    return NextResponse.json({ error: "Payment is not ready yet." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("stripe-webhook", error instanceof Error ? error.message : "signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await admin.rpc("release_checkout_session", { p_session: session.id });
    return NextResponse.json({ ok: true });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ ok: true });
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return NextResponse.json({ ok: true });

  const payment = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";
  const paid = await admin.rpc("mark_order_paid", { p_session: session.id, p_payment: payment });
  const order = paid.data as (PaidOrder & { ok?: boolean; already?: boolean; error?: string }) | null;
  if (paid.error || !order?.ok) {
    return NextResponse.json({ error: order?.error ?? "The payment could not be recorded." }, { status: 400 });
  }
  if (order.already) return NextResponse.json({ ok: true });

  const claimed = await admin.rpc("claim_order_email", { p_order: order.orderId });
  if (claimed.data !== true) return NextResponse.json({ ok: true });
  const sent = await sendPaidOrderEmails({
    ...order,
    paid: true,
    checkoutSessionId: session.id,
    stripeInvoiceId: typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null,
  });
  if (!sent) {
    await admin.rpc("clear_order_email", { p_order: order.orderId });
    return NextResponse.json({ error: "The confirmation email could not be sent." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
