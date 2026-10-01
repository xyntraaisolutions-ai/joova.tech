export type PasswordEmailTemplate = {
  fromName: string;
  fromEmail: string;
  subject: string;
  heading: string;
  body: string;
  buttonLabel: string;
  footer: string;
};

export const passwordEmailFrom = {
  name: "Joova Customer Support",
  email: "support@joova.tech",
} as const;

export const orderEmailDefaults: PasswordEmailTemplate = {
  fromName: passwordEmailFrom.name,
  fromEmail: passwordEmailFrom.email,
  subject: "Your Joova order {{order_id}}",
  heading: "Your order is confirmed",
  body: "Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt. The Stripe invoice is attached.\n\nShipping is free in the United States. Orders ship from US warehouses and are delivered in 7 to 10 days. We will email you again when it ships.",
  buttonLabel: "Track this order",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

export type OrderReceiptLine = {
  name: string;
  detail: string;
  quantity: number;
  amount: string;
};

export type OrderReceipt = {
  orderId: string;
  date: string;
  email: string;
  shipTo: string[];
  lines: OrderReceiptLine[];
  subtotal: string;
  discount?: string;
  shipping: string;
  tax?: string;
  total: string;
  note: string;
};

export const passwordEmailDefaults: PasswordEmailTemplate = {
  fromName: passwordEmailFrom.name,
  fromEmail: passwordEmailFrom.email,
  subject: "Reset your Joova password",
  heading: "Reset your password",
  body: "We received a request to reset the password for {{email}}.\n\nUse the button below. It opens Joova so you can choose a new password. If you did not ask for this, you can ignore this email.",
  buttonLabel: "Choose a new password",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

export function applyPlaceholders(source: string, values: Record<string, string>) {
  return source.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => values[key] ?? "");
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type EmailLogo = { url: string; width: number; height: number } | null;

function emailLogoMarkup(logo: EmailLogo, name: string) {
  const brand = escapeHtml(name || "Joova");
  if (!logo?.url || logo.width < 1 || logo.height < 1) {
    return `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#0c121c;">${brand}</p>`;
  }
  const scale = Math.min(160 / logo.width, 48 / logo.height);
  const width = Math.max(1, Math.round(logo.width * scale));
  const height = Math.max(1, Math.round(logo.height * scale));
  return `<img src="${escapeHtml(logo.url)}" alt="${brand}" width="${width}" height="${height}" style="display:block;border:0;width:${width}px;height:auto;">`;
}

export function renderPasswordEmail(
  template: PasswordEmailTemplate,
  values: Record<string, string> & { reset_link: string },
  logo: EmailLogo,
) {
  const filled = {
    fromName: applyPlaceholders(template.fromName, values),
    subject: applyPlaceholders(template.subject, values),
    heading: applyPlaceholders(template.heading, values),
    body: applyPlaceholders(template.body, values),
    buttonLabel: applyPlaceholders(template.buttonLabel, values),
    footer: applyPlaceholders(template.footer, values),
  };
  const paragraphs = filled.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c121c;">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const logoMarkup = emailLogoMarkup(logo, values.site_name);
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#0c121c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;padding:32px;">
          <tr><td>${logoMarkup}</td></tr>
          <tr><td style="padding-top:28px;font-size:28px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(filled.heading)}</td></tr>
          <tr><td style="padding-top:16px;">${paragraphs}</td></tr>
          <tr>
            <td style="padding-top:8px;">
              <a href="${escapeHtml(values.reset_link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(filled.buttonLabel)}</a>
            </td>
          </tr>
          <tr><td style="padding-top:20px;font-size:13px;line-height:1.5;color:#6b7280;">Or copy this link into your browser:<br><a href="${escapeHtml(values.reset_link)}" style="color:#0c121c;">${escapeHtml(values.reset_link)}</a></td></tr>
          <tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(filled.footer)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = [filled.heading, "", filled.body, "", `${filled.buttonLabel}: ${values.reset_link}`, "", filled.footer].join("\n");
  return { subject: filled.subject, html, text, fromName: filled.fromName };
}

export function renderOrderEmail(
  template: PasswordEmailTemplate,
  values: Record<string, string> & { track_link: string },
  receipt: OrderReceipt,
  logo: EmailLogo,
) {
  const filled = {
    fromName: applyPlaceholders(template.fromName, values),
    subject: applyPlaceholders(template.subject, values),
    heading: applyPlaceholders(template.heading, values),
    body: applyPlaceholders(template.body, values),
    buttonLabel: applyPlaceholders(template.buttonLabel, values),
    footer: applyPlaceholders(template.footer, values),
  };
  const paragraphs = filled.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c121c;">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const logoMarkup = emailLogoMarkup(logo, values.site_name);
  const rows = receipt.lines
    .map(
      (line) => `<tr>
        <td style="padding:12px 0;border-top:1px solid #e7e5e4;font-size:15px;line-height:1.4;color:#0c121c;">
          <strong>${escapeHtml(line.name)}</strong>${line.detail ? `<br><span style="color:#6b7280;">${escapeHtml(line.detail)}</span>` : ""}
        </td>
        <td style="padding:12px 8px;border-top:1px solid #e7e5e4;font-size:15px;text-align:center;vertical-align:top;">${line.quantity}</td>
        <td style="padding:12px 0;border-top:1px solid #e7e5e4;font-size:15px;text-align:right;vertical-align:top;white-space:nowrap;">${escapeHtml(line.amount)}</td>
      </tr>`,
    )
    .join("");
  const address = receipt.shipTo.map((line) => escapeHtml(line)).join("<br>");
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#0c121c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:24px;padding:32px;">
          <tr><td>${logoMarkup}</td></tr>
          <tr><td style="padding-top:28px;font-size:28px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(filled.heading)}</td></tr>
          <tr><td style="padding-top:16px;">${paragraphs}</td></tr>
          <tr>
            <td style="padding-top:8px;">
              <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Receipt</p>
              <p style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(receipt.orderId)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;vertical-align:top;font-size:14px;line-height:1.5;">
                    <span style="color:#6b7280;">Date</span><br>${escapeHtml(receipt.date)}
                  </td>
                  <td style="width:50%;vertical-align:top;font-size:14px;line-height:1.5;">
                    <span style="color:#6b7280;">Ship to</span><br>${address}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Item</td>
                  <td style="padding-bottom:8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;text-align:center;">Qty</td>
                  <td style="padding-bottom:8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;text-align:right;">Amount</td>
                </tr>
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#6b7280;">Subtotal</td>
                  <td style="padding:8px 0;font-size:15px;text-align:right;">${escapeHtml(receipt.subtotal)}</td>
                </tr>
                ${receipt.discount ? `<tr>
                  <td style="padding:8px 0;font-size:15px;color:#6b7280;">Discount</td>
                  <td style="padding:8px 0;font-size:15px;text-align:right;">${escapeHtml(receipt.discount)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:8px 0;border-top:1px solid #e7e5e4;font-size:15px;color:#6b7280;">Shipping</td>
                  <td style="padding:8px 0;border-top:1px solid #e7e5e4;font-size:15px;text-align:right;">${escapeHtml(receipt.shipping)}</td>
                </tr>
                ${receipt.tax ? `<tr>
                  <td style="padding:8px 0;font-size:15px;color:#6b7280;">Sales tax</td>
                  <td style="padding:8px 0;font-size:15px;text-align:right;">${escapeHtml(receipt.tax)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:12px 0;border-top:1px solid #0c121c;font-size:18px;font-weight:700;">Total</td>
                  <td style="padding:12px 0;border-top:1px solid #0c121c;font-size:18px;font-weight:700;text-align:right;">${escapeHtml(receipt.total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding-top:8px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(receipt.note)}</td></tr>
          <tr>
            <td style="padding-top:20px;">
              <a href="${escapeHtml(values.track_link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(filled.buttonLabel)}</a>
            </td>
          </tr>
          <tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(filled.footer)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const textLines = [
    filled.heading,
    "",
    filled.body,
    "",
    `Receipt ${receipt.orderId}`,
    `Date: ${receipt.date}`,
    "Ship to:",
    ...receipt.shipTo,
    "",
    ...receipt.lines.map((line) => `${line.name}${line.detail ? ` (${line.detail})` : ""} × ${line.quantity}  ${line.amount}`),
    "",
    `Subtotal ${receipt.subtotal}`,
    ...(receipt.discount ? [`Discount ${receipt.discount}`] : []),
    `Shipping ${receipt.shipping}`,
    ...(receipt.tax ? [`Sales tax ${receipt.tax}`] : []),
    `Total ${receipt.total}`,
    "",
    receipt.note,
    `${filled.buttonLabel}: ${values.track_link}`,
    "",
    filled.footer,
  ];
  return { subject: filled.subject, html, text: textLines.join("\n"), fromName: filled.fromName };
}
