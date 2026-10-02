const fromAddress = "Joova Customer Support <support@joova.tech>";
const replyTo = "support@joova.tech";
const defaultSupport = "support@joova.tech";

const orderDefaults = {
  subject: "Your Joova order {{order_id}}",
  heading: "Your order is confirmed",
  body: "Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt.\n\nEach item lists its warranty, shipping, and return eligibility. Eligible products ship free in the United States, leave US warehouses, and arrive in 7 to 10 days. We will email you again when it ships.",
  buttonLabel: "Track this order",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function projectUrl() {
  return (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
}

function serviceHeaders() {
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyPlaceholders(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => values[key] ?? "");
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(amount) ? amount : 0);
}

function taxLabel(percent: number) {
  const fixed = percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  const [whole, fraction = ""] = fixed.split(".");
  return `${whole}.${(fraction + "00").slice(0, Math.max(2, fraction.length))}%`;
}

function purchaseDetail(item: { color?: unknown; selection?: unknown }) {
  const selection = item.selection && typeof item.selection === "object" ? item.selection as Record<string, unknown> : {};
  const labels = selection.labels && typeof selection.labels === "object" ? selection.labels as Record<string, unknown> : {};
  const rows: string[] = [];
  const colorName = text(selection.color) || text(item.color);
  if (colorName) rows.push(`${text(labels.color) || "Color"} ${colorName}`);
  if (text(selection.type)) rows.push(`${text(labels.type) || "Type"} ${text(selection.type)}`);
  if (text(selection.size)) rows.push(`${text(labels.size) || "Size"} ${text(selection.size)}`);
  if (text(selection.custom)) rows.push(`${text(labels.custom) || "Custom"} ${text(selection.custom)}`);
  if (text(selection.sku)) rows.push(`SKU ${text(selection.sku)}`);
  return rows.join(" · ");
}

async function rpc(name: string, body: Record<string, string>) {
  const response = await fetch(`${projectUrl()}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

async function restGet(path: string) {
  const response = await fetch(`${projectUrl()}/rest/v1/${path}`, {
    headers: { ...serviceHeaders(), Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function allowedPdf(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "invoice.stripe.com" || url.hostname === "pay.stripe.com");
  } catch {
    return false;
  }
}

async function invoiceAttachment(invoiceId: string, orderId: string) {
  const key = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
  if (!invoiceId.startsWith("in_") || (!key.startsWith("sk_") && !key.startsWith("rk_"))) return undefined;
  const invoiceResponse = await fetch(`https://api.stripe.com/v1/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!invoiceResponse.ok) return undefined;
  const invoice = await invoiceResponse.json().catch(() => null) as { status?: string; invoice_pdf?: string } | null;
  const pdfUrl = invoice?.invoice_pdf ?? "";
  if (invoice?.status !== "paid" || !allowedPdf(pdfUrl)) return undefined;
  const file = await fetch(pdfUrl);
  if (!file.ok) return undefined;
  const content = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
  if (content.length < 32) return undefined;
  const filename = `joova-invoice-${orderId.replace(/[^A-Za-z0-9-]+/g, "")}.pdf`;
  return [{ filename, content }];
}

function logoMarkup(logo: { url: string; width: number; height: number } | null, brand: string) {
  const name = escapeHtml(brand || "Joova");
  if (!logo || !logo.url.startsWith("https://") || logo.width < 1 || logo.height < 1) {
    return `<span style="font-size:18px;font-weight:700;">${name}</span>`;
  }
  const scale = Math.min(160 / logo.width, 48 / logo.height);
  const width = Math.max(1, Math.round(logo.width * scale));
  const height = Math.max(1, Math.round(logo.height * scale));
  return `<img src="${escapeHtml(logo.url)}" alt="${name}" width="${width}" height="${height}" style="display:block;border:0;outline:none;width:${width}px;height:auto;">`;
}

function addressLines(shipping: Record<string, unknown>) {
  return [
    text(shipping.name),
    text(shipping.line1),
    text(shipping.line2),
    [text(shipping.city), text(shipping.region), text(shipping.postal)].filter(Boolean).join(", "),
    "United States",
  ].filter(Boolean);
}

function publicSiteUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol === "https:" && (host === "joova.tech" || host.endsWith(".joova.tech"))) return url.origin;
  } catch {
    /* Use the public site when the stored address is local. */
  }
  return "https://joova.tech";
}

async function loadCopy() {
  const [templates, settingsRows, logos] = await Promise.all([
    restGet("email_templates?id=eq.order_confirmation&select=subject,heading,body,button_label,footer"),
    restGet("site_settings?id=eq.1&select=email,site_url,brand"),
    restGet("brand_logos?active=eq.true&select=url,width,height&limit=1"),
  ]);
  const template = Array.isArray(templates) ? templates[0] as Record<string, unknown> | undefined : undefined;
  const settings = Array.isArray(settingsRows) ? settingsRows[0] as Record<string, unknown> | undefined : undefined;
  const logoRow = Array.isArray(logos) ? logos[0] as Record<string, unknown> | undefined : undefined;
  const logoUrl = text(logoRow?.url);
  const logoWidth = Number(logoRow?.width ?? 0);
  const logoHeight = Number(logoRow?.height ?? 0);
  return {
    subject: text(template?.subject) || orderDefaults.subject,
    heading: text(template?.heading) || orderDefaults.heading,
    body: text(template?.body) || orderDefaults.body,
    buttonLabel: text(template?.button_label) || orderDefaults.buttonLabel,
    footer: text(template?.footer) || orderDefaults.footer,
    supportEmail: text(settings?.email) || defaultSupport,
    siteUrl: publicSiteUrl(text(settings?.site_url) || "https://joova.tech"),
    brand: text(settings?.brand) || "Joova",
    logo: logoUrl.startsWith("https://") && logoWidth > 0 && logoHeight > 0
      ? { url: logoUrl, width: logoWidth, height: logoHeight }
      : null,
  };
}

function receiptEmail(order: Record<string, unknown>, copy: Awaited<ReturnType<typeof loadCopy>>) {
  const orderId = text(order.orderId);
  const email = text(order.email);
  const shipping = order.shipping && typeof order.shipping === "object" ? order.shipping as Record<string, unknown> : {};
  const name = text(shipping.name) || "there";
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const taxAmount = Number(order.taxAmount ?? 0);
  const shippingAmount = Number(order.shippingAmount ?? 0);
  const total = subtotal - discount + taxAmount + shippingAmount;
  const taxPercent = order.taxPercent === null || order.taxPercent === undefined || order.taxPercent === "" ? null : Number(order.taxPercent);
  const promo = text(order.promoCode);
  const discountLabel = discount > 0 ? `−${money(discount)}${promo ? ` (${promo})` : ""}` : "";
  const shippingLabel = shippingAmount > 0 ? `${text(order.shippingName) ? `${text(order.shippingName)} · ` : ""}${money(shippingAmount)}` : "Free";
  const taxText = taxPercent === null || !Number.isFinite(taxPercent) ? "" : `${taxLabel(taxPercent)} · ${money(taxAmount)}`;
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Chicago" }).format(new Date());
  const shipTo = addressLines(shipping);
  const lines = items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const quantity = Number(row.quantity ?? 1) || 1;
    const coverage = Array.isArray(row.coverage) ? row.coverage.filter((line) => typeof line === "string").join("\n") : "";
    return [{
      name: text(row.name) || "Item",
      detail: purchaseDetail(row),
      coverage,
      quantity,
      amount: money(Number(row.price ?? 0) * quantity),
    }];
  });
  const values = {
    order_id: orderId,
    email,
    name,
    total: money(total),
    support_email: copy.supportEmail,
    site_name: copy.brand,
    track_link: `${copy.siteUrl}/track`,
  };
  const heading = applyPlaceholders(copy.heading, values);
  const body = applyPlaceholders(copy.body, values);
  const buttonLabel = applyPlaceholders(copy.buttonLabel, values);
  const footer = applyPlaceholders(copy.footer, values);
  const subject = applyPlaceholders(copy.subject, values);
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c121c;">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const rows = lines.map((line) => `<tr>
    <td style="padding:12px 0;border-top:1px solid #e7e5e4;font-size:15px;line-height:1.4;color:#0c121c;"><strong>${escapeHtml(line.name)}</strong>${line.detail ? `<br><span style="color:#6b7280;">${escapeHtml(line.detail)}</span>` : ""}${line.coverage ? `<br><span style="color:#6b7280;">${escapeHtml(line.coverage).replaceAll("\n", "<br>")}</span>` : ""}</td>
    <td style="padding:12px 8px;border-top:1px solid #e7e5e4;font-size:15px;text-align:center;vertical-align:top;">${line.quantity}</td>
    <td style="padding:12px 0;border-top:1px solid #e7e5e4;font-size:15px;text-align:right;vertical-align:top;white-space:nowrap;">${escapeHtml(line.amount)}</td>
  </tr>`).join("");
  const note = `Paid with Stripe. Joova does not store your card number. Order ${orderId} · ${email}`;
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#0c121c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:24px;padding:32px;">
        <tr><td>${logoMarkup(copy.logo, copy.brand)}</td></tr>
        <tr><td style="padding-top:28px;font-size:28px;font-weight:700;">${escapeHtml(heading)}</td></tr>
        <tr><td style="padding-top:16px;">${paragraphs}</td></tr>
        <tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Receipt</p><p style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(orderId)}</p></td></tr>
        <tr><td style="padding-top:16px;font-size:14px;line-height:1.5;"><span style="color:#6b7280;">Date</span><br>${escapeHtml(date)}<br><br><span style="color:#6b7280;">Ship to</span><br>${shipTo.map((line) => escapeHtml(line)).join("<br>")}</td></tr>
        <tr><td style="padding-top:20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
        <tr><td style="padding-top:8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;color:#6b7280;">Subtotal</td><td style="padding:8px 0;text-align:right;">${escapeHtml(money(subtotal))}</td></tr>
          ${discountLabel ? `<tr><td style="padding:8px 0;color:#6b7280;">Discount</td><td style="padding:8px 0;text-align:right;">${escapeHtml(discountLabel)}</td></tr>` : ""}
          <tr><td style="padding:8px 0;border-top:1px solid #e7e5e4;color:#6b7280;">Shipping</td><td style="padding:8px 0;border-top:1px solid #e7e5e4;text-align:right;">${escapeHtml(shippingLabel)}</td></tr>
          ${taxText ? `<tr><td style="padding:8px 0;color:#6b7280;">Sales tax</td><td style="padding:8px 0;text-align:right;">${escapeHtml(taxText)}</td></tr>` : ""}
          <tr><td style="padding:12px 0;border-top:1px solid #0c121c;font-size:18px;font-weight:700;">Total</td><td style="padding:12px 0;border-top:1px solid #0c121c;font-size:18px;font-weight:700;text-align:right;">${escapeHtml(money(total))}</td></tr>
        </table></td></tr>
        <tr><td style="padding-top:8px;font-size:13px;color:#6b7280;">${escapeHtml(note)}</td></tr>
        <tr><td style="padding-top:20px;"><a href="${escapeHtml(values.track_link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(buttonLabel)}</a></td></tr>
        <tr><td style="padding-top:28px;font-size:13px;color:#6b7280;">${escapeHtml(footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const plain = [
    heading,
    "",
    body,
    "",
    `Receipt ${orderId}`,
    `Date: ${date}`,
    "Ship to:",
    ...shipTo,
    "",
    ...lines.flatMap((line) => [
      `${line.name}${line.detail ? ` (${line.detail})` : ""} × ${line.quantity}  ${line.amount}`,
      ...(line.coverage ? [line.coverage] : []),
    ]),
    "",
    `Subtotal ${money(subtotal)}`,
    ...(discountLabel ? [`Discount ${discountLabel}`] : []),
    `Shipping ${shippingLabel}`,
    ...(taxText ? [`Sales tax ${taxText}`] : []),
    `Total ${money(total)}`,
    "",
    note,
    `${buttonLabel}: ${values.track_link}`,
    "",
    footer,
  ].join("\n");
  return { subject, html, text: plain, supportEmail: copy.supportEmail, total: money(total), name, email, orderId };
}

async function sendMail(input: { to: string; subject: string; text: string; html: string; attachments?: { filename: string; content: string }[] }) {
  const resendKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  if (resendKey.length <= 8) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress,
      to: [input.to],
      reply_to: replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      ...(input.attachments ? { attachments: input.attachments } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { name?: string } | null;
    console.log("resend", response.status, detail?.name ?? "");
    return false;
  }
  return true;
}

async function loadPaidOrder(sessionId: string) {
  const orders = await restGet(
    `orders?checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=id,email,subtotal,tax_percent,tax_amount,shipping_amount,shipping_name,discount_amount,promo_code,shipping,payment_status,confirmation_sent_at`,
  );
  const row = Array.isArray(orders) ? orders[0] as Record<string, unknown> | undefined : undefined;
  if (!row || text(row.payment_status) !== "paid") return null;
  const orderId = text(row.id);
  const items = await restGet(
    `order_items?order_id=eq.${encodeURIComponent(orderId)}&select=name,quantity,price,color,selection,coverage&order=name`,
  );
  return {
    orderId,
    email: text(row.email),
    subtotal: row.subtotal,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shipping: row.shipping,
    shippingAmount: row.shipping_amount,
    shippingName: row.shipping_name,
    discountAmount: row.discount_amount,
    promoCode: row.promo_code,
    confirmationSentAt: text(row.confirmation_sent_at),
    items: Array.isArray(items) ? items : [],
  };
}

const staffDefaults = {
  subject: "New paid order {{order_id}}",
  heading: "New paid order",
  body: "{{name}} paid {{total}} for {{order_id}}.\n\n{{email}}",
  buttonLabel: "Open support",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

async function staffOrderEmail(copy: Awaited<ReturnType<typeof loadCopy>>, values: Record<string, string>) {
  const rows = await restGet("email_templates?id=eq.staff_order&select=subject,heading,body,button_label,footer");
  const template = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : undefined;
  const filled = {
    subject: applyPlaceholders(text(template?.subject) || staffDefaults.subject, values),
    heading: applyPlaceholders(text(template?.heading) || staffDefaults.heading, values),
    body: applyPlaceholders(text(template?.body) || staffDefaults.body, values),
    buttonLabel: applyPlaceholders(text(template?.button_label) || staffDefaults.buttonLabel, values),
    footer: applyPlaceholders(text(template?.footer) || staffDefaults.footer, values),
  };
  const link = `${copy.siteUrl}/portal/support`;
  const paragraphs = filled.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c121c;">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#0c121c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;padding:32px;">
        <tr><td>${logoMarkup(copy.logo, copy.brand)}</td></tr>
        <tr><td style="padding-top:28px;font-size:28px;font-weight:700;">${escapeHtml(filled.heading)}</td></tr>
        <tr><td style="padding-top:16px;">${paragraphs}</td></tr>
        <tr><td style="padding-top:8px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(filled.buttonLabel)}</a></td></tr>
        <tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(filled.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const textBody = [filled.heading, "", filled.body, `${filled.buttonLabel}: ${link}`, "", filled.footer].join("\n");
  return { subject: filled.subject, html, text: textBody };
}

export async function deliverConfirmation(sessionId: string, invoiceId = "") {
  const order = await loadPaidOrder(sessionId);
  if (!order) return { emailSent: false };
  if (order.confirmationSentAt) return { emailSent: true };
  const claimed = await rpc("claim_order_email", { p_order: order.orderId });
  if (claimed.data !== true) {
    const again = await loadPaidOrder(sessionId);
    return { emailSent: Boolean(again?.confirmationSentAt) };
  }
  const copy = await loadCopy();
  const rendered = receiptEmail(order, copy);
  const attachments = invoiceId ? await invoiceAttachment(invoiceId, order.orderId) : undefined;
  const customer = rendered.email
    ? await sendMail({ to: rendered.email, subject: rendered.subject, text: rendered.text, html: rendered.html, attachments })
    : false;
  if (!customer) {
    await rpc("clear_order_email", { p_order: order.orderId });
    return { emailSent: false };
  }
  const staffMail = await staffOrderEmail(copy, {
    order_id: text(order.orderId),
    email: rendered.email,
    name: rendered.name,
    total: rendered.total,
    support_email: copy.supportEmail,
    site_name: copy.brand,
  });
  const staff = await sendMail({
    to: rendered.supportEmail,
    subject: staffMail.subject,
    text: staffMail.text,
    html: staffMail.html,
  });
  if (!staff) console.log("order-receipt", "staff copy failed", order.orderId);
  return { emailSent: true };
}
