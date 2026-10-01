import { NextRequest, NextResponse } from "next/server";
import { recordPaidCheckout } from "@/lib/checkout/record-paid";
import { stripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CheckoutStatus = {
  found?: boolean;
  orderId?: string;
  paymentStatus?: string;
  email?: string;
  emailSent?: boolean;
};

function stripeId(value: string | { id?: string } | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id ?? "";
}

export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ found: false }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_status", { p_session: sessionId });
  if (error) return NextResponse.json({ error: "That payment could not be confirmed." }, { status: 400 });
  const status = (data ?? { found: false }) as CheckoutStatus;
  if (!status.found || !status.orderId) return NextResponse.json(status);

  if (status.paymentStatus === "paid") {
    const admin = createAdminClient();
    const saved = await admin.from("orders").select("email, confirmation_sent_at").eq("id", status.orderId).maybeSingle();
    if (saved.data?.confirmation_sent_at) {
      return NextResponse.json({ ...status, email: saved.data.email ?? status.email, emailSent: true });
    }
  }

  const stripe = await stripeClient();
  if (!stripe) return NextResponse.json(status);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (retrieveError) {
    console.error("checkout-status", retrieveError instanceof Error ? retrieveError.message : "retrieve");
    return NextResponse.json(status);
  }
  if (session.id !== sessionId || session.payment_status !== "paid") return NextResponse.json(status);

  const recorded = await recordPaidCheckout({
    sessionId,
    paymentId: stripeId(session.payment_intent),
    invoiceId: stripeId(session.invoice) || null,
  });
  if (!recorded.ok) return NextResponse.json(status);
  return NextResponse.json({
    found: true,
    orderId: recorded.orderId,
    paymentStatus: "paid",
    email: recorded.email || status.email,
    emailSent: recorded.emailSent,
  });
}
