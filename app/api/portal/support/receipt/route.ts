import { NextResponse } from "next/server";
import { requirePortalApi } from "@/lib/portal/api";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { loadBrandMark, logoBytes } from "@/lib/brand/logo";
import { renderOrderConfirmation, type PaidOrder } from "@/lib/mail/order";
import { receiptLogoDataUri, receiptPdf, receiptPdfFilename } from "@/lib/mail/receipt-pdf";

const orderSelect =
  "id, email, subtotal, tax_percent, tax_amount, shipping, created_at, payment_status, order_items(name, quantity, price, color, selection)";

function filename(orderId: string, extension: "html" | "pdf") {
  const safe = orderId.replace(/[^A-Za-z0-9-]+/g, "");
  return extension === "pdf" ? receiptPdfFilename(orderId) : `joova-receipt-${safe}.html`;
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["support"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "The receipt is not ready yet." }, { status: 503 });
  }
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order")?.trim().slice(0, 40) ?? "";
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "html";
  if (!orderId) return NextResponse.json({ error: "Choose an order." }, { status: 400 });
  const found = await gate.session.supabase.from("orders").select(orderSelect).eq("id", orderId).maybeSingle();
  if (found.error || !found.data) return NextResponse.json({ error: "That order could not be loaded." }, { status: 400 });
  const row = found.data;
  const order: PaidOrder = {
    orderId: row.id,
    email: row.email,
    subtotal: row.subtotal ?? 0,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shipping: (row.shipping ?? {}) as PaidOrder["shipping"],
    items: (row.order_items ?? []) as PaidOrder["items"],
    createdAt: row.created_at ?? undefined,
    paid: row.payment_status === "paid",
  };

  const mark = await loadBrandMark();
  const bytes = mark.logo ? await logoBytes(mark.logo.url) : null;
  const imageType = bytes && bytes.length > 4 && bytes.toString("ascii", 1, 4) === "PNG"
    ? "image/png"
    : bytes && bytes.toString("ascii", 0, 3) === "GIF"
      ? "image/gif"
      : bytes && bytes.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp"
        : "image/jpeg";

  if (format === "pdf") {
    const pdf = await receiptPdf(order, bytes, mark.brand);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename(order.orderId, "pdf")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const rendered = await renderOrderConfirmation(order, bytes ? receiptLogoDataUri(bytes, imageType) : undefined);
  return new NextResponse(rendered.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename(order.orderId, "html")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
