import { NextResponse } from "next/server";
import { requirePortalApi } from "@/lib/portal/api";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { PaidOrder } from "@/lib/mail/order";
import { invoicePdfFilename } from "@/lib/mail/receipt-pdf";
import { ensureOrderInvoice, stripeInvoiceFile } from "@/lib/stripe/invoice";

const orderSelect =
  "id, email, subtotal, tax_percent, tax_amount, shipping, created_at, payment_status, checkout_session_id, stripe_invoice_id, order_items(name, quantity, price, color, selection)";

export async function GET(request: Request) {
  const gate = await requirePortalApi(["support"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "The invoice is not ready yet." }, { status: 503 });
  }
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order")?.trim().slice(0, 40) ?? "";
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "view";
  if (!orderId) return NextResponse.json({ error: "Choose an order." }, { status: 400 });
  const found = await gate.session.supabase.from("orders").select(orderSelect).eq("id", orderId).maybeSingle();
  if (found.error || !found.data) return NextResponse.json({ error: "That order could not be loaded." }, { status: 400 });
  const row = found.data;
  if (row.payment_status !== "paid") {
    return NextResponse.json({ error: "The Stripe invoice is available after the order is paid." }, { status: 400 });
  }
  const order: PaidOrder = {
    orderId: row.id,
    email: row.email,
    subtotal: row.subtotal ?? 0,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shipping: (row.shipping ?? {}) as PaidOrder["shipping"],
    items: (row.order_items ?? []) as PaidOrder["items"],
    createdAt: row.created_at ?? undefined,
    paid: true,
    checkoutSessionId: row.checkout_session_id,
    stripeInvoiceId: row.stripe_invoice_id,
  };
  const invoice = await ensureOrderInvoice(order);
  if (!invoice) return NextResponse.json({ error: "The Stripe invoice could not be loaded." }, { status: 502 });

  if (format === "view") return NextResponse.redirect(invoice.hostedUrl);

  const pdf = await stripeInvoiceFile(invoice.pdfUrl);
  if (!pdf) return NextResponse.json({ error: "The Stripe invoice could not be downloaded." }, { status: 502 });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoicePdfFilename(order.orderId)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
