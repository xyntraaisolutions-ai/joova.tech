import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordPaidCheckout } from "@/lib/checkout/record-paid";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null;
  const recorded = await recordPaidCheckout({ sessionId: session.id, paymentId: payment, invoiceId });
  if (!recorded.ok) {
    return NextResponse.json({ error: recorded.error }, { status: 400 });
  }
  if (!recorded.emailSent) {
    return NextResponse.json({ error: "The confirmation email could not be sent." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
