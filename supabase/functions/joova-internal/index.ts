const fromAddress = "Joova Customer Support <support@joova.tech>";
const replyTo = "support@joova.tech";

function same(leftValue: string, rightValue: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(leftValue);
  const right = encoder.encode(rightValue);
  if (left.byteLength !== right.byteLength) return false;
  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
}

function mailAttachments(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const attachments = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const filename = String((item as { filename?: unknown }).filename ?? "");
    const content = String((item as { content?: unknown }).content ?? "").replace(/\s/g, "");
    if (!/^[\w.-]{1,80}\.pdf$/i.test(filename)) return [];
    if (content.length < 32 || content.length > 8_000_000 || !/^[A-Za-z0-9+/=]+$/.test(content)) return [];
    return [{ filename, content }];
  }).slice(0, 2);
  return attachments.length ? attachments : undefined;
}

async function callerIsService(token: string, serviceKey: string) {
  if (serviceKey && same(token, serviceKey)) return true;
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  if (!url || token.length < 20) return false;
  const response = await fetch(`${url}/rest/v1/rpc/read_super_admin_email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: token,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  await response.body?.cancel();
  return response.ok;
}

async function passwordMatchesHash(email: string, password: string) {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey || !email || !password) return false;
  const response = await fetch(`${url}/rest/v1/rpc/super_admin_password_ok`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_email: email, p_password: password }),
  });
  if (!response.ok) return false;
  const data = await response.json().catch(() => false);
  return data === true;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();

  let body: {
    action?: string;
    email?: string;
    password?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
    attachments?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const superAdminEmail = (Deno.env.get("SUPER_ADMIN_EMAIL") ?? "").trim().toLowerCase();
  const resendKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();

  if (body.action === "sign-in") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const superAdmin = superAdminEmail.includes("@") && email === superAdminEmail;
    if (!superAdmin) return Response.json({ superAdmin: false, passwordOk: false });
    if (password.length < 1 || password.length > 100) return Response.json({ superAdmin: true, passwordOk: false });
    const passwordOk = await passwordMatchesHash(email, password);
    return Response.json({ superAdmin: true, passwordOk });
  }

  if (!(await callerIsService(token, serviceKey))) return Response.json({ error: "not allowed" }, { status: 401 });
  if (body.action === "stripe-secret") {
    const key = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
    if (!key.startsWith("sk_") && !key.startsWith("rk_")) return Response.json({ error: "missing" }, { status: 503 });
    return Response.json({ key });
  }
  if (body.action === "ready") {
    return Response.json({ superAdmin: superAdminEmail.includes("@"), resend: resendKey.length > 8 });
  }
  if (body.action === "super-admin-email") return Response.json({ email: superAdminEmail });
  if (body.action !== "send-reset") return Response.json({ error: "invalid" }, { status: 400 });
  if (resendKey.length <= 8) return Response.json({ error: "missing" }, { status: 503 });

  const to = String(body.to ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const text = String(body.text ?? "");
  const html = String(body.html ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || !text || !html) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (subject.length > 200 || text.length > 20_000 || html.length > 80_000) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const attachments = mailAttachments(body.attachments);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      reply_to: replyTo,
      subject,
      text,
      html,
      ...(attachments ? { attachments } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const name = detail && typeof detail === "object" && "name" in detail ? String(detail.name) : "";
    console.log("resend", response.status, name);
    const reason = response.status === 401 || response.status === 403 ? "rejected" : "send";
    return Response.json({ error: reason }, { status: 502 });
  }
  return Response.json({ ok: true });
});
