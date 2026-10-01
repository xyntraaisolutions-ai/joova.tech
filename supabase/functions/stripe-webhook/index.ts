const fromAddress = "Joova Customer Support <support@joova.tech>";
const replyTo = "support@joova.tech";
const defaultSupport = "support@joova.tech";

const orderDefaults = {
  subject: "Your Joova order {{order_id}}",
  heading: "Your order is confirmed",
  body: "Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt. The Stripe invoice is attached.\n\nEach item lists its warranty, shipping, and return eligibility. Eligible products ship free in the United States, leave US warehouses, and arrive in 7 to 10 days. We will email you again when it ships.",
  buttonLabel: "Track this order",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

function same(leftValue: string, rightValue: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(leftValue);
  const right = encoder.encode(rightValue);
  if (left.byteLength !== right.byteLength) return false;
  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function serviceHeaders() {
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  };
}

function projectUrl() {
  return (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
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

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signatureOk(raw: string, header: string, secret: string) {
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (age > 300) return false;
  const expected = await hmacHex(secret, `${timestamp}.${raw}`);
  return signatures.some((candidate) => same(candidate, expected));
}

function stripeId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return "";
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

function addressLines(shipping: Record<string, unknown>) {
  return [
    text(shipping.name),
    text(shipping.line1),
    text(shipping.line2),
    [text(shipping.city), text(shipping.region), text(shipping.postal)].filter(Boolean).join(", "),
    "United States",
  ].filter(Boolean);
}

async function loadCopy() {
  const [templates, settingsRows] = await Promise.all([
    restGet("email_templates?id=eq.order_confirmation&select=subject,heading,body,button_label,footer"),
    restGet("site_settings?id=eq.1&select=email,site_url,brand"),
  ]);
  const template = Array.isArray(templates) ? templates[0] as Record<string, unknown> | undefined : undefined;
  const settings = Array.isArray(settingsRows) ? settingsRows[0] as Record<string, unknown> | undefined : undefined;
  return {
    subject: text(template?.subject) || orderDefaults.subject,
    heading: text(template?.heading) || orderDefaults.heading,
    body: text(template?.body) || orderDefaults.body,
    buttonLabel: text(template?.button_label) || orderDefaults.buttonLabel,
    footer: text(template?.footer) || orderDefaults.footer,
    supportEmail: text(settings?.email) || defaultSupport,
    siteUrl: (text(settings?.site_url) || "https://joova.tech").replace(/\/$/, ""),
    brand: text(settings?.brand) || "Joova",
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
        <tr><td style="font-size:18px;font-weight:700;">${escapeHtml(copy.brand)}</td></tr>
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
  const text = [
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
  return { subject, html, text, supportEmail: copy.supportEmail, total: money(total), name, email, orderId };
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
    console.log("resend", response.status);
    return false;
  }
  return true;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const raw = await request.text();
  const secret = (Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "").trim();
  const url = projectUrl();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (secret.length < 8 || !url || serviceKey.length < 20) {
    return Response.json({ error: "Payment is not ready yet." }, { status: 503 });
  }
  const header = request.headers.get("stripe-signature") ?? "";
  if (!header) return Response.json({ error: "Missing signature." }, { status: 400 });
  if (!(await signatureOk(raw, header, secret))) return Response.json({ error: "Invalid signature." }, { status: 400 });

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const session = event.data?.object ?? {};
  const sessionId = text(session.id);

  if (event.type === "checkout.session.expired") {
    const released = await rpc("release_checkout_session", { p_session: sessionId });
    if (!released.ok) return Response.json({ error: "The checkout could not be released." }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (event.type !== "checkout.session.completed") return Response.json({ ok: true });
  if (session.payment_status !== "paid") return Response.json({ ok: true });

  const paid = await rpc("mark_order_paid", { p_session: sessionId, p_payment: stripeId(session.payment_intent) });
  const order = paid.data && typeof paid.data === "object" ? paid.data as Record<string, unknown> : null;
  if (!paid.ok || order?.ok !== true) {
    return Response.json({ error: text(order?.error) || "The payment could not be recorded." }, { status: 400 });
  }
  if (order.already === true) return Response.json({ ok: true });

  const orderId = text(order.orderId);
  const claimed = await rpc("claim_order_email", { p_order: orderId });
  if (claimed.data !== true) return Response.json({ ok: true });

  const copy = await loadCopy();
  const rendered = receiptEmail(order, copy);
  const invoiceId = stripeId(session.invoice);
  const attachments = invoiceId ? await invoiceAttachment(invoiceId, orderId) : undefined;
  if (invoiceId && !attachments) console.log("stripe-webhook", "invoice missing", orderId);
  const customer = rendered.email
    ? await sendMail({ to: rendered.email, subject: rendered.subject, text: rendered.text, html: rendered.html, attachments })
    : false;
  if (!customer) {
    await rpc("clear_order_email", { p_order: orderId });
    return Response.json({ error: "The confirmation email could not be sent." }, { status: 500 });
  }
  const staff = await sendMail({
    to: rendered.supportEmail,
    subject: `New paid order ${orderId}`,
    text: [`Paid order ${orderId}`, rendered.email, rendered.total, rendered.name].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:22px">New paid order ${escapeHtml(orderId)}</h1><p>${escapeHtml(rendered.email)} · ${escapeHtml(rendered.total)}</p></div>`,
  });
  if (!staff) console.log("stripe-webhook", "staff copy failed", orderId);
  return Response.json({ ok: true });
});
