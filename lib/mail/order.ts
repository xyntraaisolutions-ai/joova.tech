import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { orderEmailDefaults, passwordEmailFrom, renderOrderEmail, type OrderReceipt } from "@/lib/mail/template";
import { loadBrandMark, publicLogoUrl } from "@/lib/brand/logo";
import { invoicePdfFilename } from "@/lib/mail/receipt-pdf";
import { sendNoticeEmail } from "@/lib/mail/notice";
import { sendTransactionalEmail } from "@/lib/mail/send";
import { ensureOrderInvoice, stripeInvoiceFile } from "@/lib/stripe/invoice";
import { taxPercentLabel } from "@/lib/tax/avalara";
import { formatUsd } from "@/lib/utils";
import { coverageList } from "@/lib/catalog/coverage";
import { purchaseText } from "@/lib/content/variants";

type Ship = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
};

type Line = {
  name?: string;
  quantity?: number;
  price?: number | string;
  color?: string | null;
  selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string; labels?: Record<string, string> } | null;
  coverage?: unknown;
};

export type PaidOrder = {
  orderId: string;
  email: string;
  subtotal: number | string;
  taxPercent?: number | string | null;
  taxAmount?: number | string | null;
  shippingAmount?: number | string | null;
  shippingName?: string | null;
  discountAmount?: number | string | null;
  promoCode?: string | null;
  shipping: Ship;
  items: Line[];
  createdAt?: string;
  paid?: boolean;
  checkoutSessionId?: string | null;
  stripeInvoiceId?: string | null;
};

function money(value: number | string | undefined) {
  return formatUsd(Number(value ?? 0));
}

function addressLines(ship: Ship) {
  return [
    ship.name,
    ship.line1,
    ship.line2,
    [ship.city, ship.region, ship.postal].filter(Boolean).join(", "),
    "United States",
  ].filter((line): line is string => Boolean(line && line.trim()));
}

function chargedTotal(order: PaidOrder) {
  return Number(order.subtotal ?? 0) - Number(order.discountAmount ?? 0) + Number(order.taxAmount ?? 0) + Number(order.shippingAmount ?? 0);
}

function receipt(order: PaidOrder, date: string): OrderReceipt {
  const taxPercent = order.taxPercent === null || order.taxPercent === undefined ? null : Number(order.taxPercent);
  return {
    orderId: order.orderId,
    date,
    email: order.email,
    shipTo: addressLines(order.shipping),
    lines: order.items.map((item) => {
      const quantity = item.quantity ?? 1;
      return {
        name: item.name ?? "Item",
        detail: purchaseText(item.selection, item.color ?? undefined),
        coverage: coverageList(item.coverage).join("\n"),
        quantity,
        amount: money(Number(item.price ?? 0) * quantity),
      };
    }),
    subtotal: money(order.subtotal),
    discount: Number(order.discountAmount ?? 0) > 0 ? `−${money(order.discountAmount ?? 0)}${order.promoCode ? ` (${order.promoCode})` : ""}` : undefined,
    shipping: Number(order.shippingAmount ?? 0) > 0 ? `${order.shippingName ? `${order.shippingName} · ` : ""}${money(order.shippingAmount ?? 0)}` : "Free",
    tax: taxPercent === null ? undefined : `${taxPercentLabel(taxPercent)} · ${money(order.taxAmount ?? 0)}`,
    total: money(chargedTotal(order)),
    note:
      order.paid === false
        ? `Payment is not complete. Order ${order.orderId} · ${order.email}`
        : `Paid with Stripe. Joova does not store your card number. Order ${order.orderId} · ${order.email}`,
  };
}

function orderDate(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Chicago" }).format(date);
}

export async function renderOrderConfirmation(order: PaidOrder, logoUrlOverride?: string) {
  const loaded = await loadOrderEmail();
  const siteUrl = loaded.siteUrl || "https://joova.tech";
  const track = `${siteUrl}/track`;
  const mark = await loadBrandMark();
  const logoUrl = logoUrlOverride || (mark.logo ? publicLogoUrl(mark.logo.url, siteUrl) : "");
  const logo = logoUrl && mark.logo ? { url: logoUrl, width: mark.logo.width, height: mark.logo.height } : null;
  const template = { ...loaded.template };
  if (order.paid === false) {
    template.subject = "Joova receipt {{order_id}}";
    template.heading = "Order receipt";
    template.body = "This receipt is for order {{order_id}}, placed by {{name}}.\n\nPayment is not complete yet. The line items below are the purchase on this order.";
  }
  const name = order.shipping.name?.trim() || "there";
  return renderOrderEmail(
    template,
    {
      order_id: order.orderId,
      email: order.email,
      name,
      total: money(chargedTotal(order)),
      support_email: loaded.supportEmail,
      site_name: loaded.brand,
      track_link: track,
    },
    receipt(order, orderDate(order.createdAt)),
    logo,
  );
}

async function invoiceAttachment(order: PaidOrder) {
  const invoice = await ensureOrderInvoice(order);
  if (!invoice) return undefined;
  const pdf = await stripeInvoiceFile(invoice.pdfUrl);
  if (!pdf) return undefined;
  return [{ filename: invoicePdfFilename(order.orderId), content: pdf.toString("base64") }];
}

export async function resendOrderConfirmation(order: PaidOrder) {
  if (!order.email || order.paid === false) return false;
  const rendered = await renderOrderConfirmation(order);
  const attachments = await invoiceAttachment(order);
  if (!attachments) console.error("order-mail", "stripe invoice missing", order.orderId);
  return sendTransactionalEmail({
    to: order.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    attachments,
  });
}

async function loadOrderEmail() {
  const template = { ...orderEmailDefaults, fromName: passwordEmailFrom.name, fromEmail: passwordEmailFrom.email };
  const admin = createAdminClient();
  const [saved, settings] = await Promise.all([
    admin.from("email_templates").select("subject, heading, body, button_label, footer").eq("id", "order_confirmation").maybeSingle(),
    admin.from("site_settings").select("email, site_url, brand").eq("id", 1).maybeSingle(),
  ]);
  const row = saved.data;
  if (row) {
    template.subject = row.subject || template.subject;
    template.heading = row.heading || template.heading;
    template.body = row.body || template.body;
    template.buttonLabel = row.button_label || template.buttonLabel;
    template.footer = row.footer || template.footer;
  }
  return {
    template,
    supportEmail: settings.data?.email || passwordEmailFrom.email,
    siteUrl: (settings.data?.site_url || "").replace(/\/$/, ""),
    brand: settings.data?.brand || "Joova",
  };
}

async function orderAlertEmails(fallback: string) {
  const backup = fallback.includes("@") ? [fallback] : [];
  if (!isServiceRoleConfigured()) return backup;
  const listed = await createAdminClient()
    .from("notification_recipients")
    .select("email")
    .eq("kind", "order")
    .eq("email_enabled", true)
    .is("deleted_at", null);
  const emails = (listed.data ?? [])
    .map((row) => String(row.email ?? "").trim().toLowerCase())
    .filter((email) => email.includes("@"));
  const unique = [...new Set(emails)];
  return unique.length ? unique : backup;
}

export async function sendPaidOrderEmails(order: PaidOrder) {
  if (!order.email) return false;
  const loaded = await loadOrderEmail();
  const rendered = await renderOrderConfirmation(order);
  const name = order.shipping.name?.trim() || "there";
  const attachments = await invoiceAttachment(order);
  if (!attachments) console.error("order-mail", "stripe invoice missing", order.orderId);
  const customer = await sendTransactionalEmail({
    to: order.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    attachments,
  });
  if (!customer) return false;
  const targets = await orderAlertEmails(loaded.supportEmail);
  let staff = false;
  for (const to of targets) {
    const sent = await sendNoticeEmail({
      id: "staff_order",
      to,
      values: { order_id: order.orderId, email: order.email, name, total: money(chargedTotal(order)) },
      buttonLink: `${(loaded.siteUrl || "https://joova.tech").replace(/\/$/, "")}/portal/support`,
    });
    staff = staff || sent;
  }
  if (!staff) console.error("order-mail", "staff copy failed", order.orderId);
  return true;
}

export async function sendShipmentEmail(input: { email: string; orderId: string; carrier: string; tracking: string }) {
  const loaded = await loadOrderEmail();
  const siteUrl = loaded.siteUrl || "https://joova.tech";
  return sendNoticeEmail({
    id: "shipment",
    to: input.email,
    values: {
      order_id: input.orderId,
      carrier: input.carrier || "Carrier",
      tracking: input.tracking,
    },
    buttonLink: `${siteUrl}/track`,
  });
}
