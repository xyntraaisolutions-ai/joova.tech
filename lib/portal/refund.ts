import type { SupabaseClient } from "@supabase/supabase-js";
import { stripeClient } from "@/lib/stripe/server";
import { readAvailable, syncAvailability } from "@/lib/portal/availability";
import { receiptPdf } from "@/lib/mail/receipt-pdf";
import { sendNoticeEmail } from "@/lib/mail/notice";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { PaidOrder } from "@/lib/mail/order";

export async function refundReturn(supabase: SupabaseClient, viewAs: string, returnId: string) {
  const found = await supabase
    .from("returns")
    .select("id, order_id, email, status, resolution, stripe_refund_id, stock_restored, refund_receipt_path, refund_invoice_path")
    .eq("id", returnId)
    .is("deleted_at", null)
    .maybeSingle();
  if (found.error || !found.data) return { error: "That return was not found." };
  const row = found.data;
  if (row.resolution === "exchange" && !row.stock_restored) {
    return { error: "This return is an exchange. Create the exchange order instead of refunding." };
  }
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

  const documents = await storeRefundDocuments(supabase, returnId, row.order_id, refundId);
  const fresh = !row.stock_restored;
  let emailError = "";
  if (fresh) {
    const mailed = await sendRefundEmail({
      email: row.email,
      orderId: row.order_id,
      receipt: documents.receipt,
      invoice: documents.invoice,
    });
    if (!mailed) emailError = "The refund was saved. The customer email could not be sent.";
  }
  return emailError ? { ok: true as const, notice: emailError } : { ok: true as const };
}

async function storeRefundDocuments(supabase: SupabaseClient, returnId: string, orderId: string, refundId: string) {
  const loaded = await supabase
    .from("orders")
    .select("id, email, subtotal, tax_percent, tax_amount, shipping_amount, shipping_name, discount_amount, promo_code, shipping, created_at, stripe_invoice_id, order_items(name, quantity, price, color, selection, coverage)")
    .eq("id", orderId)
    .maybeSingle();
  if (loaded.error || !loaded.data || !isServiceRoleConfigured()) return { receipt: null as Buffer | null, invoice: null as Buffer | null };
  const row = loaded.data;
  const paid: PaidOrder = {
    orderId: row.id,
    email: row.email,
    subtotal: row.subtotal,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shippingAmount: row.shipping_amount,
    shippingName: row.shipping_name,
    discountAmount: row.discount_amount,
    promoCode: row.promo_code,
    shipping: row.shipping && typeof row.shipping === "object" ? row.shipping : {},
    items: row.order_items ?? [],
    createdAt: row.created_at,
    paid: true,
  };
  const receipt = await receiptPdf(paid, null, "Joova", {
    heading: "Refund receipt",
    note: `Refund for ${paid.orderId}. The amount returns to the original payment method and appears in 5 to 10 business days after the item was received. Stripe refund ${refundId}.`,
  });
  let invoice: Buffer | null = null;
  const stripe = await stripeClient();
  const invoiceId = row.stripe_invoice_id?.trim() ?? "";
  if (stripe && invoiceId.startsWith("in_")) {
    try {
      const note = await stripe.creditNotes.create(
        {
          invoice: invoiceId,
          refunds: [{ refund: refundId }],
          reason: "order_change",
          memo: `Refund for ${orderId}`,
        },
        { idempotencyKey: `joova-credit-${returnId}` },
      );
      if (note.pdf) {
        const file = await fetch(note.pdf);
        if (file.ok) invoice = Buffer.from(await file.arrayBuffer());
      }
    } catch (error) {
      console.error("stripe-credit-note", error instanceof Error ? error.message : "failed");
    }
  }
  const admin = createAdminClient();
  const receiptPath = `${returnId}/refund-receipt.pdf`;
  const invoicePath = invoice ? `${returnId}/refund-invoice.pdf` : "";
  const savedReceipt = await admin.storage.from("return-files").upload(receiptPath, receipt, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (savedReceipt.error) console.error("return-file", savedReceipt.error.message);
  if (invoice && invoicePath) {
    const savedInvoice = await admin.storage.from("return-files").upload(invoicePath, invoice, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (savedInvoice.error) console.error("return-file", savedInvoice.error.message);
  }
  await admin.from("returns").update({
    refund_receipt_path: savedReceipt.error ? "" : receiptPath,
    ...(invoicePath ? { refund_invoice_path: invoicePath } : {}),
  }).eq("id", returnId);
  return { receipt, invoice };
}

async function sendRefundEmail(input: { email: string; orderId: string; receipt: Buffer | null; invoice: Buffer | null }) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return false;
  let siteUrl = "https://joova.tech";
  if (isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const settings = await admin.from("site_settings").select("site_url").eq("id", 1).maybeSingle();
    siteUrl = (settings.data?.site_url || siteUrl).replace(/\/$/, "");
  }
  const attachments = [
    ...(input.receipt ? [{ filename: `joova-refund-receipt-${input.orderId}.pdf`, content: input.receipt.toString("base64") }] : []),
    ...(input.invoice ? [{ filename: `joova-refund-invoice-${input.orderId}.pdf`, content: input.invoice.toString("base64") }] : []),
  ];
  return sendNoticeEmail({
    id: "refund",
    to: email,
    values: { order_id: input.orderId },
    buttonLink: `${siteUrl}/account?order=${encodeURIComponent(input.orderId)}`,
    attachments,
  });
}
