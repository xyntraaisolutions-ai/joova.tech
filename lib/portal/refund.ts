import type { SupabaseClient } from "@supabase/supabase-js";
import { stripeClient } from "@/lib/stripe/server";
import { readAvailable, syncAvailability } from "@/lib/portal/availability";

export async function refundReturn(supabase: SupabaseClient, viewAs: string, returnId: string) {
  const found = await supabase
    .from("returns")
    .select("id, order_id, status, stripe_refund_id, stock_restored")
    .eq("id", returnId)
    .is("deleted_at", null)
    .maybeSingle();
  if (found.error || !found.data) return { error: "That return was not found." };
  const row = found.data;
  const order = await supabase
    .from("orders")
    .select("id, payment_status, payment_reference")
    .eq("id", row.order_id)
    .maybeSingle();
  if (order.error || !order.data) return { error: "That order could not be loaded." };
  if (order.data.payment_status !== "paid") return { error: "This order is not paid." };
  const payment = order.data.payment_reference?.trim() ?? "";
  if (!payment) return { error: "This order has no Stripe payment to refund." };

  let refundId = row.stripe_refund_id?.trim() ?? "";
  if (!refundId) {
    const stripe = await stripeClient();
    if (!stripe) return { error: "Stripe is not ready to refund this payment." };
    try {
      const refund = await stripe.refunds.create(
        { payment_intent: payment },
        { idempotencyKey: `joova-refund-${returnId}` },
      );
      refundId = refund.id;
    } catch (error) {
      console.error("stripe-refund", error instanceof Error ? error.message : "failed");
      return { error: "The card could not be refunded. The return was not marked refunded." };
    }
  }

  const products = await supabase.from("order_items").select("product_id").eq("order_id", row.order_id);
  const ids = [...new Set((products.data ?? []).map((item) => item.product_id))];
  const before = new Map<string, number>();
  if (!row.stock_restored) {
    await Promise.all(ids.map(async (id) => {
      before.set(id, await readAvailable(supabase, id));
    }));
  }

  const completed = await supabase.rpc("support_complete_refund", {
    p_id: returnId,
    p_refund: refundId,
    p_view_as: viewAs,
  });
  const body = completed.data as { ok?: boolean; error?: string } | null;
  if (completed.error || body?.ok !== true) {
    return { error: body?.error ?? completed.error?.message ?? "The refund was sent, but the return could not be updated." };
  }

  await Promise.all([...before.entries()].map(([id, previous]) => syncAvailability(supabase, id, previous)));
  return { ok: true as const };
}
