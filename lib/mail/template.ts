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
  body: "Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt. The Stripe invoice is attached.\n\nEach item lists its warranty, shipping, and return eligibility. Eligible products ship free in the United States, leave US warehouses, and arrive in 7 to 10 days. We will email you again when it ships.",
  buttonLabel: "Track this order",
  footer: "Joova Tech LLC · Grapevine, Texas · {{support_email}}",
};

export type OrderReceiptLine = {
  name: string;
  detail: string;
  coverage: string;
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

const sharedFooter = "Joova Tech LLC · Grapevine, Texas · {{support_email}}";

export const noticeEmailDefaults = {
  warranty_replacement: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Warranty replacement {{order_id}}",
    heading: "Your replacement is being prepared",
    body: "Warranty replacement {{order_id}} is being prepared.\n\nIt is for your original order {{source_order}}. It ships the same way as a new order. We will email you when it ships.",
    buttonLabel: "Track this order",
    footer: sharedFooter,
  },
  exchange_order: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Exchange order {{order_id}}",
    heading: "Your exchange is being prepared",
    body: "Exchange order {{order_id}} is being prepared.\n\nIt replaces your original order {{source_order}}. It ships the same way as a new order. We will email you when it ships.",
    buttonLabel: "Track this order",
    footer: sharedFooter,
  },
  shipment: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Your Joova order {{order_id}} has shipped",
    heading: "Your order has shipped",
    body: "Order {{order_id}} has shipped.\n\n{{carrier}}\nTracking number: {{tracking}}",
    buttonLabel: "Track this order",
    footer: sharedFooter,
  },
  review_request: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "How was order {{order_id}}?",
    heading: "How was your order?",
    body: "Order {{order_id}} was delivered.\n\nIf you would like to share a review, send it from the reviews page. We publish a review after we read it.",
    buttonLabel: "Write a review",
    footer: sharedFooter,
  },
  refund: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Refund for {{order_id}}",
    heading: "Your refund was sent",
    body: "The refund for order {{order_id}} has been sent.\n\nIt returns to the original payment method and appears 5 to 10 business days after we received the item. The refund receipt is attached.",
    buttonLabel: "Track this order",
    footer: sharedFooter,
  },
  back_in_stock: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "{{product}} is available again",
    heading: "{{product}} is back",
    body: "Hi {{name}},\n\n{{product}} is back in stock.",
    buttonLabel: "View this item",
    footer: sharedFooter,
  },
  low_stock: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Low stock: {{product}}",
    heading: "Low stock",
    body: "{{product}} is down to {{available}} available.\n\nSKU {{sku}}. Available is on hand minus reserved.",
    buttonLabel: "Open inventory",
    footer: sharedFooter,
  },
  staff_order: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "New paid order {{order_id}}",
    heading: "New paid order",
    body: "{{name}} paid {{total}} for {{order_id}}.\n\n{{email}}",
    buttonLabel: "Open support",
    footer: sharedFooter,
  },
  staff_return: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Return request for {{order_id}}",
    heading: "New return request",
    body: "{{name}} asked for a {{resolution}} on {{order_id}}.\n\n{{email}}\n\n{{reason}}",
    buttonLabel: "Open support",
    footer: sharedFooter,
  },
  staff_warranty: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Warranty claim for {{order_id}}",
    heading: "New warranty claim",
    body: "{{name}} started a warranty claim for {{order_id}}.\n\n{{email}}\n\n{{message}}",
    buttonLabel: "Open support",
    footer: sharedFooter,
  },
  stock_request: {
    fromName: passwordEmailFrom.name,
    fromEmail: passwordEmailFrom.email,
    subject: "Customer request: {{product}}",
    heading: "Customer request",
    body: "{{name}} requested an out-of-stock item.\n\n{{product}}\nSKU {{sku}}\n\nReply to {{email}}\n\n{{note}}",
    buttonLabel: "Reply",
    footer: sharedFooter,
  },
} as const satisfies Record<string, PasswordEmailTemplate>;

export type NoticeEmailId = keyof typeof noticeEmailDefaults;

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
  const link = values.reset_link.trim();
  const button = link
    ? `<tr>
            <td style="padding-top:8px;">
              <a href="${escapeHtml(link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(filled.buttonLabel)}</a>
            </td>
          </tr>
          <tr><td style="padding-top:20px;font-size:13px;line-height:1.5;color:#6b7280;">Or copy this link into your browser:<br><a href="${escapeHtml(link)}" style="color:#0c121c;">${escapeHtml(link)}</a></td></tr>`
    : "";
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
          ${button}
          <tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(filled.footer)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = [filled.heading, "", filled.body, link ? `${filled.buttonLabel}: ${link}` : "", filled.footer].filter((line) => line !== "").join("\n");
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
          <strong>${escapeHtml(line.name)}</strong>${line.detail ? `<br><span style="color:#6b7280;">${escapeHtml(line.detail)}</span>` : ""}${line.coverage ? `<br><span style="color:#6b7280;">${escapeHtml(line.coverage).replaceAll("\n", "<br>")}</span>` : ""}
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
    ...receipt.lines.flatMap((line) => [
      `${line.name}${line.detail ? ` (${line.detail})` : ""} × ${line.quantity}  ${line.amount}`,
      ...(line.coverage ? [line.coverage] : []),
    ]),
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
