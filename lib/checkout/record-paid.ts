import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaidOrderEmails, type PaidOrder } from "@/lib/mail/order";

type PaidResult = PaidOrder & { ok?: boolean; already?: boolean; error?: string };

const orderColumns =
  "id, email, subtotal, tax_percent, tax_amount, shipping_amount, shipping_name, discount_amount, promo_code, shipping, created_at, payment_status, checkout_session_id, stripe_invoice_id, confirmation_sent_at, order_items(name, quantity, price, color, selection, coverage)";

export type RecordedCheckout = {
  ok: true;
  already: boolean;
  orderId: string;
  email: string;
  emailSent: boolean;
};

export type RecordedCheckoutFailure = {
  ok: false;
  error: string;
};

function paidOrder(row: {
  id: string;
  email: string | null;
  subtotal: number | string | null;
  tax_percent?: number | string | null;
  tax_amount?: number | string | null;
  shipping_amount?: number | string | null;
  shipping_name?: string | null;
  discount_amount?: number | string | null;
  promo_code?: string | null;
  shipping: PaidOrder["shipping"] | null;
  created_at?: string | null;
  checkout_session_id?: string | null;
  stripe_invoice_id?: string | null;
  order_items: PaidOrder["items"] | null;
}, invoiceId: string | null): PaidOrder {
  return {
    orderId: row.id,
    email: row.email ?? "",
    subtotal: row.subtotal ?? 0,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shippingAmount: row.shipping_amount,
    shippingName: row.shipping_name,
    discountAmount: row.discount_amount,
    promoCode: row.promo_code,
    shipping: row.shipping ?? {},
    items: row.order_items ?? [],
    createdAt: row.created_at ?? undefined,
    paid: true,
    checkoutSessionId: row.checkout_session_id,
    stripeInvoiceId: invoiceId || row.stripe_invoice_id,
  };
}

async function sendConfirmation(orderId: string, sessionId: string, invoiceId: string | null, fallback: PaidOrder | null) {
  const admin = createAdminClient();
  const current = await admin.from("orders").select("confirmation_sent_at, email").eq("id", orderId).maybeSingle();
  if (current.data?.confirmation_sent_at) {
    return { email: current.data.email ?? fallback?.email ?? "", emailSent: true };
  }
  const claimed = await admin.rpc("claim_order_email", { p_order: orderId });
  if (claimed.data !== true) {
    const again = await admin.from("orders").select("confirmation_sent_at, email").eq("id", orderId).maybeSingle();
    return { email: again.data?.email ?? fallback?.email ?? "", emailSent: Boolean(again.data?.confirmation_sent_at) };
  }
  let order = fallback;
  if (!order) {
    const loaded = await admin.from("orders").select(orderColumns).eq("id", orderId).maybeSingle();
    if (!loaded.data) {
      await admin.rpc("clear_order_email", { p_order: orderId });
      return { email: "", emailSent: false };
    }
    order = paidOrder(loaded.data, invoiceId);
  }
  const sent = await sendPaidOrderEmails({
    ...order,
    paid: true,
    checkoutSessionId: sessionId,
    stripeInvoiceId: invoiceId || order.stripeInvoiceId || null,
  });
  if (!sent) {
    await admin.rpc("clear_order_email", { p_order: orderId });
    return { email: order.email, emailSent: false };
  }
  return { email: order.email, emailSent: true };
}

export async function recordPaidCheckout(input: {
  sessionId: string;
  paymentId: string;
  invoiceId?: string | null;
}): Promise<RecordedCheckout | RecordedCheckoutFailure> {
  const admin = createAdminClient();
  const paid = await admin.rpc("mark_order_paid", {
    p_session: input.sessionId,
    p_payment: input.paymentId,
  });
  const order = paid.data as PaidResult | null;
  if (paid.error || !order?.ok || !order.orderId) {
    return { ok: false, error: order?.error ?? "The payment could not be recorded." };
  }
  const mailed = await sendConfirmation(
    order.orderId,
    input.sessionId,
    input.invoiceId ?? null,
    order.already ? null : order,
  );
  return {
    ok: true,
    already: Boolean(order.already),
    orderId: order.orderId,
    email: mailed.email || order.email || "",
    emailSent: mailed.emailSent,
  };
}
