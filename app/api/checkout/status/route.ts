import { NextRequest, NextResponse } from "next/server";
import { confirmCheckoutPayment } from "@/lib/checkout/pay";
import { createClient } from "@/lib/supabase/server";

type CheckoutStatus = {
  found?: boolean;
  orderId?: string;
  paymentStatus?: string;
  email?: string;
  emailSent?: boolean;
};

export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ found: false }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_status", { p_session: sessionId });
  if (error) return NextResponse.json({ error: "That payment could not be confirmed." }, { status: 400 });
  const status = (data ?? { found: false }) as CheckoutStatus;
  const confirmed = await confirmCheckoutPayment(sessionId);
  if (confirmed?.found) {
    return NextResponse.json({
      ...status,
      ...confirmed,
      email: confirmed.email || status.email,
    });
  }
  return NextResponse.json(status);
}
