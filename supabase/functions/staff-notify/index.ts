const fromAddress = "Joova Customer Support <support@joova.tech>";
const replyTo = "support@joova.tech";

const copy = {
  return: {
    id: "staff_return",
    subject: "Return request for {{order_id}}",
    heading: "New return request",
    body: "{{name}} asked for a {{resolution}} on {{order_id}}.\n\n{{email}}\n\n{{reason}}",
    buttonLabel: "Open support",
  },
  warranty: {
    id: "staff_warranty",
    subject: "Warranty claim for {{order_id}}",
    heading: "New warranty claim",
    body: "{{name}} started a warranty claim for {{order_id}}.\n\n{{email}}\n\n{{message}}",
    buttonLabel: "Open support",
  },
} as const;

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const url = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!url || !serviceKey) return Response.json({ error: "not ready" }, { status: 503 });

  let body: { kind?: string; orderId?: string; email?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const kind = body.kind === "warranty" ? "warranty" : body.kind === "return" ? "return" : "";
  const orderId = String(body.orderId ?? "").trim().toUpperCase().slice(0, 40);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const id = String(body.id ?? "").trim();
  if (!kind || (kind === "return" && (!orderId || !email.includes("@"))) || (kind === "warranty" && !id && (!orderId || !email.includes("@")))) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" };
  const row = kind === "return"
    ? await latestReturn(url, headers, orderId, email)
    : await latestClaim(url, headers, orderId, email, id);
  if (!row) return Response.json({ ok: true, skipped: true });
  if (row.staff_notified_at) {
    const notified = Date.parse(row.staff_notified_at);
    const opened = Date.parse(row.created);
    if (Number.isFinite(notified) && Number.isFinite(opened) && notified >= opened) {
      return Response.json({ ok: true, skipped: true });
    }
  }
  const age = Date.now() - Date.parse(row.created);
  if (!Number.isFinite(age) || age < 0 || age > 30 * 60 * 1000) return Response.json({ ok: true, skipped: true });

  const recipients = await rest(url, headers, `notification_recipients?kind=eq.${kind}&email_enabled=eq.true&deleted_at=is.null&select=email`);
  const targets = uniqueEmails(Array.isArray(recipients) ? recipients : []);
  const settings = await rest(url, headers, "site_settings?id=eq.1&select=email,site_url,brand");
  const setting = Array.isArray(settings) ? settings[0] as Record<string, unknown> | undefined : undefined;
  const siteUrl = publicSite(String(setting?.site_url ?? ""));
  const templateRows = await rest(url, headers, `email_templates?id=eq.${copy[kind].id}&select=subject,heading,body,button_label,footer`);
  const template = Array.isArray(templateRows) ? templateRows[0] as Record<string, unknown> | undefined : undefined;
  const values = {
    order_id: row.orderId,
    email: row.email,
    name: row.name || "A customer",
    resolution: row.resolution || "return",
    reason: row.reason,
    message: row.message,
    support_email: String(setting?.email ?? replyTo),
    site_name: String(setting?.brand ?? "Joova"),
  };
  const rendered = render(template, copy[kind], values, `${siteUrl}/portal/support`);
  let sent = false;
  const resendKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  if (resendKey.length > 8) {
    for (const to of targets) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          reply_to: replyTo,
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        }),
      });
      sent = sent || response.ok;
    }
  }
  if (sent || targets.length === 0) {
    const table = kind === "return" ? "returns" : "warranty_claims";
    await fetch(`${url}/rest/v1/${table}?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ staff_notified_at: new Date().toISOString() }),
    });
  }
  return Response.json({ ok: true, sent });
});

type AlertRow = {
  id: string;
  orderId: string;
  email: string;
  name: string;
  created: string;
  staff_notified_at: string;
  resolution: string;
  reason: string;
  message: string;
};

async function latestReturn(url: string, headers: Record<string, string>, orderId: string, email: string): Promise<AlertRow | null> {
  const rows = await rest(url, headers, `returns?order_id=eq.${encodeURIComponent(orderId)}&email=eq.${encodeURIComponent(email)}&deleted_at=is.null&select=id,order_id,email,reason,resolution,requested_at,staff_notified_at&order=requested_at.desc&limit=1`);
  const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : undefined;
  if (!row?.id) return null;
  return {
    id: String(row.id),
    orderId: String(row.order_id ?? orderId),
    email: String(row.email ?? email),
    name: String(row.email ?? "A customer"),
    created: String(row.requested_at ?? ""),
    staff_notified_at: String(row.staff_notified_at ?? ""),
    resolution: String(row.resolution ?? "return"),
    reason: String(row.reason ?? "").slice(0, 500),
    message: "",
  };
}

async function latestClaim(url: string, headers: Record<string, string>, orderId: string, email: string, id: string): Promise<AlertRow | null> {
  const path = id
    ? `warranty_claims?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=id,order_id,email,name,message,created_at,staff_notified_at&limit=1`
    : `warranty_claims?order_id=eq.${encodeURIComponent(orderId)}&email=eq.${encodeURIComponent(email)}&deleted_at=is.null&select=id,order_id,email,name,message,created_at,staff_notified_at&order=created_at.desc&limit=1`;
  const rows = await rest(url, headers, path);
  const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : undefined;
  if (!row?.id) return null;
  if (!id && String(row.order_id ?? "").toUpperCase() !== orderId.toUpperCase()) return null;
  return {
    id: String(row.id),
    orderId: String(row.order_id ?? orderId),
    email: String(row.email ?? email),
    name: String(row.name ?? "A customer"),
    created: String(row.created_at ?? ""),
    staff_notified_at: String(row.staff_notified_at ?? ""),
    resolution: "",
    reason: "",
    message: String(row.message ?? "").slice(0, 500),
  };
}

async function rest(url: string, headers: Record<string, string>, path: string) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { ...headers, Accept: "application/json" } });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function uniqueEmails(rows: { email?: string }[]) {
  return [...new Set(rows.map((row) => String(row.email ?? "").trim().toLowerCase()).filter((email) => email.includes("@")))];
}

function publicSite(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && (url.hostname === "joova.tech" || url.hostname.endsWith(".joova.tech"))) return url.origin;
  } catch {
    /* Use the public site when the stored address is local. */
  }
  return "https://joova.tech";
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => values[key] ?? "");
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function render(
  saved: Record<string, unknown> | undefined,
  fallback: { subject: string; heading: string; body: string; buttonLabel: string },
  values: Record<string, string>,
  link: string,
) {
  const subject = fill(String(saved?.subject || fallback.subject), values);
  const heading = fill(String(saved?.heading || fallback.heading), values);
  const body = fill(String(saved?.body || fallback.body), values);
  const buttonLabel = fill(String(saved?.button_label || fallback.buttonLabel), values);
  const footer = fill(String(saved?.footer || "Joova Tech LLC · Grapevine, Texas · {{support_email}}"), values);
  const paragraphs = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c121c;">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#0c121c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;padding:32px;">
        <tr><td style="font-size:18px;font-weight:700;">${escapeHtml(values.site_name || "Joova")}</td></tr>
        <tr><td style="padding-top:28px;font-size:28px;font-weight:700;">${escapeHtml(heading)}</td></tr>
        <tr><td style="padding-top:16px;">${paragraphs}</td></tr>
        <tr><td style="padding-top:8px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#ff5a05;color:#0c121c;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px;">${escapeHtml(buttonLabel)}</a></td></tr>
        <tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(footer)}</td></tr>
      </table>
    </td></tr></table></body></html>`;
  return { subject, html, text: [heading, "", body, `${buttonLabel}: ${link}`, "", footer].join("\n") };
}
