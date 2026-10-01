import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaidOrder } from "@/lib/mail/order";
import { purchaseText } from "@/lib/content/variants";
import { stripeClient } from "@/lib/stripe/server";

export type OrderInvoice = {
  id: string;
  hostedUrl: string;
  pdfUrl: string;
};

function invoiceRef(value: string | Stripe.Invoice | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id;
}

function cents(value: number | string | undefined) {
  return Math.max(0, Math.round(Number(value ?? 0) * 100));
}

function stripeDocumentUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.hostname !== "invoice.stripe.com" && url.hostname !== "pay.stripe.com") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function pack(invoice: Stripe.Invoice): OrderInvoice | null {
  const hostedUrl = stripeDocumentUrl(invoice.hosted_invoice_url);
  const pdfUrl = stripeDocumentUrl(invoice.invoice_pdf);
  if (invoice.status !== "paid" || !hostedUrl || !pdfUrl) return null;
  return { id: invoice.id, hostedUrl, pdfUrl };
}

async function remember(orderId: string, invoiceId: string) {
  const admin = createAdminClient();
  const saved = await admin.from("orders").update({ stripe_invoice_id: invoiceId }).eq("id", orderId);
  if (saved.error) console.error("stripe-invoice", saved.error.message);
}

async function loadPaid(stripe: Stripe, id: string, orderId: string) {
  const invoice = await stripe.invoices.retrieve(id);
  const ready = pack(invoice);
  if (!ready) return null;
  await remember(orderId, ready.id);
  return ready;
}

async function finishBackfill(stripe: Stripe, id: string, orderId: string) {
  let invoice = await stripe.invoices.retrieve(id);
  if (invoice.metadata?.source !== "joova" || invoice.metadata.orderId !== orderId) return null;
  if (invoice.status === "draft") {
    invoice = await stripe.invoices.finalizeInvoice(id, {}, { idempotencyKey: `joova-invoice-finalize-${orderId}` });
  }
  if (invoice.status !== "paid") {
    invoice = await stripe.invoices.pay(id, { paid_out_of_band: true }, { idempotencyKey: `joova-invoice-pay-${orderId}` });
  }
  const ready = pack(invoice);
  if (!ready) return null;
  await remember(orderId, ready.id);
  return ready;
}

async function sessionInvoice(stripe: Stripe, sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const id = invoiceRef(session.invoice);
  return { id, enabled: session.invoice_creation?.enabled === true };
}

async function createBackfill(stripe: Stripe, order: PaidOrder) {
  const email = order.email.trim().toLowerCase();
  if (!email || order.items.length === 0) return null;
  const listed = await stripe.customers.list({ email, limit: 1 });
  const customer =
    listed.data[0] ??
    (await stripe.customers.create(
      {
        email,
        name: order.shipping.name?.trim() || undefined,
        metadata: { orderId: order.orderId },
      },
      { idempotencyKey: `joova-customer-${order.orderId}` },
    ));

  const invoice = await stripe.invoices.create(
    {
      customer: customer.id,
      collection_method: "charge_automatically",
      auto_advance: false,
      description: `Joova order ${order.orderId}`,
      footer: "Joova Tech LLC · Grapevine, Texas",
      metadata: { orderId: order.orderId, source: "joova" },
      pending_invoice_items_behavior: "exclude",
    },
    { idempotencyKey: `joova-invoice-${order.orderId}` },
  );

  const taxCents = cents(Number(order.taxAmount ?? 0));
  for (const [index, item] of order.items.entries()) {
    const quantity = item.quantity ?? 1;
    const detail = purchaseText(item.selection, item.color ?? undefined);
    const name = item.name ?? "Item";
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        description: detail ? `${name} · ${detail}` : name,
        quantity,
        unit_amount_decimal: Stripe.Decimal.from(cents(item.price)),
      },
      { idempotencyKey: `joova-invoice-item-${order.orderId}-${index}` },
    );
  }
  const shippingCents = cents(Number(order.shippingAmount ?? 0));
  if (shippingCents > 0) {
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        description: order.shippingName || "Shipping",
        quantity: 1,
        unit_amount_decimal: Stripe.Decimal.from(shippingCents),
      },
      { idempotencyKey: `joova-invoice-shipping-${order.orderId}` },
    );
  }
  const discountCents = cents(Number(order.discountAmount ?? 0));
  if (discountCents > 0) {
    try {
      const coupon = await stripe.coupons.create(
        {
          amount_off: discountCents,
          currency: "usd",
          duration: "once",
          max_redemptions: 1,
          name: order.promoCode || "Discount",
        },
        { idempotencyKey: `joova-invoice-discount-${order.orderId}` },
      );
      await stripe.invoices.update(invoice.id, { discounts: [{ coupon: coupon.id }] });
    } catch (error) {
      console.error("stripe-invoice", error instanceof Error ? error.message : "discount");
    }
  }
  if (taxCents > 0) {
    const percent = order.taxPercent === null || order.taxPercent === undefined ? "" : `${order.taxPercent}%`;
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        description: percent ? `Sales tax (${percent})` : "Sales tax",
        quantity: 1,
        unit_amount_decimal: Stripe.Decimal.from(taxCents),
      },
      { idempotencyKey: `joova-invoice-tax-${order.orderId}` },
    );
  }

  return finishBackfill(stripe, invoice.id, order.orderId);
}

export async function ensureOrderInvoice(order: PaidOrder): Promise<OrderInvoice | null> {
  if (order.paid === false) return null;
  const stripe = await stripeClient();
  if (!stripe) return null;
  try {
    if (order.stripeInvoiceId) {
      const stored = await stripe.invoices.retrieve(order.stripeInvoiceId);
      const ready = pack(stored);
      if (ready) return ready;
      const finished = await finishBackfill(stripe, stored.id, order.orderId);
      if (finished) return finished;
    }

    if (order.checkoutSessionId) {
      let found = await sessionInvoice(stripe, order.checkoutSessionId);
      if (!found.id && found.enabled) {
        for (let attempt = 0; attempt < 4 && !found.id; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          found = await sessionInvoice(stripe, order.checkoutSessionId);
        }
      }
      if (found.id) return loadPaid(stripe, found.id, order.orderId);
      if (found.enabled) return null;
    }

    const query = `metadata['orderId']:'${order.orderId.replace(/'/g, "")}'`;
    try {
      const searched = await stripe.invoices.search({ query, limit: 1 });
      const existing = searched.data[0];
      if (existing) {
        const ready = pack(existing) ?? (await finishBackfill(stripe, existing.id, order.orderId));
        if (ready) return ready;
      }
    } catch (error) {
      console.error("stripe-invoice", error instanceof Error ? error.message : "search");
    }

    return createBackfill(stripe, order);
  } catch (error) {
    console.error("stripe-invoice", error instanceof Error ? error.message : "failed");
    return null;
  }
}

export async function stripeInvoiceFile(pdfUrl: string) {
  const safe = stripeDocumentUrl(pdfUrl);
  if (!safe) return null;
  const response = await fetch(safe);
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}
