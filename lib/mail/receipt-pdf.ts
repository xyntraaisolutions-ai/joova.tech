import PDFDocument from "pdfkit";
import { coverageList } from "@/lib/catalog/coverage";
import { purchaseText } from "@/lib/content/variants";
import type { PaidOrder } from "@/lib/mail/order";
import { taxPercentLabel } from "@/lib/tax/avalara";
import { formatUsd } from "@/lib/utils";

function safeId(orderId: string) {
  return orderId.replace(/[^A-Za-z0-9-]+/g, "");
}

export function receiptPdfFilename(orderId: string) {
  return `joova-receipt-${safeId(orderId)}.pdf`;
}

export function invoicePdfFilename(orderId: string) {
  return `joova-invoice-${safeId(orderId)}.pdf`;
}

export function receiptLogoDataUri(bytes: Buffer, type = "image/png") {
  return `data:${type};base64,${bytes.toString("base64")}`;
}

function money(value: number | string | undefined) {
  return formatUsd(Number(value ?? 0));
}

function orderDate(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Chicago" }).format(date);
}

export function receiptPdf(
  order: PaidOrder,
  logo?: Buffer | null,
  brand = "Joova",
  options?: { heading?: string; note?: string },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (logo) {
      try {
        doc.image(logo, { width: 148 });
      } catch {
        doc.fontSize(22).fillColor("#0c121c").text(brand);
      }
    } else {
      doc.fontSize(22).fillColor("#0c121c").text(brand);
    }

    const ship = [
      order.shipping.name,
      order.shipping.line1,
      order.shipping.line2,
      [order.shipping.city, order.shipping.region, order.shipping.postal].filter(Boolean).join(", "),
      "United States",
    ].filter((line): line is string => Boolean(line && line.trim()));

    doc.moveDown(0.6);
    doc.fontSize(10).fillColor("#6b7280").text("Joova Tech LLC · Grapevine, Texas");
    doc.moveDown(1.1);
    doc.fontSize(22).fillColor("#0c121c").text(options?.heading ?? "Receipt");
    doc.moveDown(0.2);
    doc.fontSize(16).text(order.orderId);
    doc.moveDown(0.8);

    const infoTop = doc.y;
    doc.fontSize(9).fillColor("#6b7280").text("Date", 48, infoTop, { width: 240 });
    doc.fontSize(11).fillColor("#0c121c").text(orderDate(order.createdAt), 48, infoTop + 14, { width: 240 });
    doc.fontSize(9).fillColor("#6b7280").text("Email", 48, infoTop + 36, { width: 240 });
    doc.fontSize(11).fillColor("#0c121c").text(order.email, 48, infoTop + 50, { width: 240 });
    doc.fontSize(9).fillColor("#6b7280").text("Ship to", 320, infoTop, { width: 244 });
    doc.fontSize(11).fillColor("#0c121c").text(ship.join("\n"), 320, infoTop + 14, { width: 244 });

    let y = Math.max(doc.y, infoTop + 14 + ship.length * 14) + 28;
    doc.fontSize(9).fillColor("#6b7280");
    doc.text("ITEM", 48, y, { width: 340 });
    doc.text("QTY", 400, y, { width: 50, align: "center" });
    doc.text("AMOUNT", 460, y, { width: 104, align: "right" });
    y += 16;
    doc.moveTo(48, y).lineTo(564, y).strokeColor("#e7e5e4").stroke();
    y += 10;

    for (const item of order.items) {
      const quantity = item.quantity ?? 1;
      const name = item.name ?? "Item";
      const detail = purchaseText(item.selection, item.color ?? undefined);
      const amount = money(Number(item.price ?? 0) * quantity);
      doc.fontSize(11).fillColor("#0c121c").text(name, 48, y, { width: 340 });
      const nameHeight = doc.heightOfString(name, { width: 340 });
      doc.text(String(quantity), 400, y, { width: 50, align: "center" });
      doc.text(amount, 460, y, { width: 104, align: "right" });
      y += nameHeight + 2;
      if (detail) {
        doc.fontSize(9).fillColor("#6b7280").text(detail, 48, y, { width: 340 });
        y += doc.heightOfString(detail, { width: 340 }) + 2;
      }
      const coverage = coverageList(item.coverage).join("\n");
      if (coverage) {
        doc.fontSize(9).fillColor("#6b7280").text(coverage, 48, y, { width: 340 });
        y += doc.heightOfString(coverage, { width: 340 }) + 10;
      } else {
        y += 10;
      }
    }

    y += 6;
    doc.moveTo(48, y).lineTo(564, y).strokeColor("#e7e5e4").stroke();
    y += 12;
    const taxPercent = order.taxPercent === null || order.taxPercent === undefined ? null : Number(order.taxPercent);
    const totals: [string, string, boolean][] = [
      ["Subtotal", money(order.subtotal), false],
      ...(Number(order.discountAmount ?? 0) > 0 ? [["Discount", `−${money(order.discountAmount ?? 0)}`, false] as [string, string, boolean]] : []),
      ["Shipping", Number(order.shippingAmount ?? 0) > 0 ? money(order.shippingAmount ?? 0) : "Free", false],
      ...(taxPercent === null ? [] : [[`Sales tax ${taxPercentLabel(taxPercent)}`, money(order.taxAmount ?? 0), false] as [string, string, boolean]]),
      ["Total", money(Number(order.subtotal ?? 0) - Number(order.discountAmount ?? 0) + Number(order.taxAmount ?? 0) + Number(order.shippingAmount ?? 0)), true],
    ];
    for (const [label, amount, strong] of totals) {
      doc.fontSize(strong ? 13 : 11).fillColor("#0c121c");
      doc.text(label, 320, y, { width: 120 });
      doc.text(amount, 460, y, { width: 104, align: "right" });
      y += strong ? 22 : 18;
    }

    const note = options?.note
      ?? (order.paid === false
        ? `Payment is not complete. Order ${order.orderId} · ${order.email}`
        : `Paid with Stripe. Joova does not store your card number. Order ${order.orderId} · ${order.email}`);
    doc.fontSize(9).fillColor("#6b7280").text(note, 48, y + 12, { width: 516 });
    doc.moveDown(2);
    doc.fontSize(9).fillColor("#6b7280").text("Joova Tech LLC · Grapevine, Texas · support@joova.tech");
    doc.end();
  });
}
