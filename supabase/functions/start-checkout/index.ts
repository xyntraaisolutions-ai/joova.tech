const shippingCodes = ["free", "standard", "expedited"] as const;

type ShippingCode = (typeof shippingCodes)[number];

type OrderRow = {
  id: string;
  email: string | null;
  status: string;
  payment_status: string;
  shipping: { region?: string; postal?: string } | null;
  confirmation_sent_at?: string | null;
};

type ItemRow = {
  name: string;
  quantity: number;
  price: number | string;
  color: string | null;
  selection: Record<string, unknown> | null;
  product_id: string;
};

type ProductRow = { id: string; commerce: { taxable?: boolean; requiresShipping?: boolean } | null };
type ShippingRow = { code: string; name: string; price: number | string; min_days: number; max_days: number; enabled: boolean };
type PromoRow = {
  code: string;
  kind: string;
  amount: number | string;
  starts_on: string | null;
  ends_on: string | null;
  max_uses: number | null;
  used_count: number;
  enabled: boolean;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function cents(price: number | string) {
  return Math.round(Number(price) * 100);
}

function isShippingCode(value: string): value is ShippingCode {
  return shippingCodes.includes(value as ShippingCode);
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

function stripeKey() {
  const key = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
  if (!key.startsWith("sk_") && !key.startsWith("rk_")) return "";
  return key;
}

function allowedOrigin(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol === "http:" && (host === "localhost" || host === "127.0.0.1")) return url.origin;
    if (url.protocol !== "https:") return "";
    if (host === "joova.tech" || host === "www.joova.tech" || host.endsWith(".netlify.app")) return url.origin;
    return "";
  } catch {
    return "";
  }
}

async function restGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${projectUrl()}/rest/v1/${path}`, {
    headers: { ...serviceHeaders(), Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null) as Promise<T | null>;
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

function purchaseDetail(item: ItemRow) {
  const selection = item.selection ?? {};
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

function taxPercentLabel(percent: number) {
  const fixed = percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  const [whole, fraction = ""] = fixed.split(".");
  return `${whole}.${(fraction + "00").slice(0, Math.max(2, fraction.length))}%`;
}

function applyDiscount(subtotal: number, tax: number, discount: number) {
  const off = Math.min(Math.max(discount, 0), subtotal);
  const ratio = subtotal > 0 ? (subtotal - off) / subtotal : 1;
  return { discount: money(off), tax: money(tax * ratio) };
}

async function quoteTax(region: string, postal: string, items: ItemRow[]) {
  const ids = [...new Set(items.map((item) => item.product_id))];
  const products = await restGet<ProductRow[]>(`products?id=in.(${ids.map(encodeURIComponent).join(",")})&select=id,commerce`);
  if (!products) return { error: "Sales tax could not be calculated." };
  const byId = new Map(products.map((product) => [product.id, product]));
  let merchandiseCents = 0;
  let taxableCents = 0;
  for (const item of items) {
    const product = byId.get(item.product_id);
    if (!product || item.quantity < 1) return { error: "Sales tax could not be calculated." };
    const line = cents(item.price) * item.quantity;
    merchandiseCents += line;
    if (product.commerce?.taxable !== false) taxableCents += line;
  }
  const found = await restGet<Array<{
    state: string;
    region_name: string | null;
    combined_rate: number | string;
    state_rate: number | string | null;
    county_rate: number | string | null;
    city_rate: number | string | null;
    special_rate: number | string | null;
  }>>(`us_zip_tax_rates?zip=eq.${encodeURIComponent(postal)}&select=state,region_name,combined_rate,state_rate,county_rate,city_rate,special_rate`);
  if (!found) return { error: "Sales tax could not be calculated." };
  const row = found[0];
  let rate = 0;
  let percent = 0;
  let label = "";
  let regionName = region;
  if (!row) {
    const fallback = await restGet<Array<{ rate_percent: number | string }>>("country_tax_rates?country_code=eq.US&select=rate_percent");
    const saved = Number(fallback?.[0]?.rate_percent);
    percent = Number.isFinite(saved) && saved >= 0 && saved <= 100 ? saved : 8.25;
    rate = percent / 100;
    label = taxPercentLabel(percent);
    regionName = "Default United States rate";
  } else {
    if (row.state !== region) return { error: "That ZIP code does not match the selected state." };
    rate = Number(row.combined_rate);
    percent = Math.round(rate * 1_000_000) / 10_000;
    label = taxPercentLabel(percent);
    regionName = row.region_name || region;
  }
  const tax = Math.round(taxableCents * rate) / 100;
  return {
    subtotal: merchandiseCents / 100,
    percent,
    label,
    regionName,
    tax,
  };
}

async function quoteShipping(productIds: string[], code: ShippingCode) {
  const ids = [...new Set(productIds)];
  const [options, products, custom, prices] = await Promise.all([
    restGet<ShippingRow[]>("shipping_options?enabled=eq.true&select=code,name,price,min_days,max_days,enabled&order=sort"),
    restGet<ProductRow[]>(`products?id=in.(${ids.map(encodeURIComponent).join(",")})&select=id,commerce`),
    restGet<Array<{ product_id: string }>>(`product_shipping?product_id=in.(${ids.map(encodeURIComponent).join(",")})&select=product_id`),
    restGet<Array<{ product_id: string; option_code: string; price: number | string | null }>>(`product_shipping_options?product_id=in.(${ids.map(encodeURIComponent).join(",")})&select=product_id,option_code,price`),
  ]);
  if (!options || !products || !custom || !prices) return { error: "Shipping options could not be loaded." };
  const enabled = options.filter((row) => isShippingCode(row.code) && row.enabled !== false);
  const found = new Map(products.map((row) => [row.id, row]));
  if (ids.some((id) => !found.has(id))) return { error: "A cart item is no longer available." };
  const shippable = ids.filter((id) => found.get(id)?.commerce?.requiresShipping !== false);
  if (!shippable.length) {
    if (code !== "free") return { error: "That shipping option is not available for this cart." };
    const free = enabled.find((option) => option.code === "free");
    return { name: free?.name ?? "Free Shipping", price: 0, minDays: free?.min_days ?? 0, maxDays: free?.max_days ?? 0 };
  }
  const customIds = new Set(custom.map((row) => row.product_id));
  const choices = shippable.map((id) => {
    if (!customIds.has(id)) return new Map(enabled.map((option) => [option.code, Number(option.price)]));
    const rows = prices.filter((row) => row.product_id === id && isShippingCode(row.option_code));
    return new Map(rows.flatMap((row) => {
      const option = enabled.find((item) => item.code === row.option_code);
      if (!option) return [];
      const price = row.price === null || row.price === undefined ? Number(option.price) : Number(row.price);
      return [[option.code, price] as const];
    }));
  });
  if (choices.some((choice) => !choice.has(code))) return { error: "That shipping option is not available for this cart." };
  const option = enabled.find((item) => item.code === code);
  if (!option) return { error: "Choose a shipping option." };
  return {
    name: option.name,
    price: money(Math.max(...choices.map((choice) => choice.get(code) ?? 0))),
    minDays: option.min_days,
    maxDays: option.max_days,
  };
}

async function promoDiscount(code: string, subtotal: number) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { code: null as string | null, discount: 0 };
  const found = await restGet<PromoRow[]>(`promo_codes?code=eq.${encodeURIComponent(trimmed)}&select=code,kind,amount,starts_on,ends_on,max_uses,used_count,enabled`);
  const row = found?.[0];
  if (!found || !row || !row.enabled) return { error: "That promo code is not available." };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  if (row.starts_on && today < row.starts_on) return { error: "That promo code is not available yet." };
  if (row.ends_on && today > row.ends_on) return { error: "That promo code has ended." };
  if (row.max_uses !== null && row.used_count >= row.max_uses) return { error: "That promo code has been used up." };
  const amount = Number(row.amount);
  const discount = row.kind === "percent" ? Math.round(subtotal * amount) / 100 : Math.min(amount, subtotal);
  return { code: row.code, discount };
}

async function stripeForm(path: string, body: URLSearchParams) {
  const key = stripeKey();
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-08-26.dahlia",
    },
    body,
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

function fail(error: string, status = 400) {
  return Response.json({ error }, { status });
}

async function start(body: {
  orderId?: string;
  token?: string;
  shippingOption?: string;
  promoCode?: string;
  origin?: string;
}) {
  if (!projectUrl() || !(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim() || !stripeKey()) {
    return fail("Payment is not ready yet.", 503);
  }
  const orderId = text(body.orderId).toUpperCase();
  const token = text(body.token);
  const shippingOption = text(body.shippingOption);
  const origin = allowedOrigin(text(body.origin));
  if (!/^JO-[A-Z0-9]{8}$/.test(orderId) || !/^[0-9a-f-]{36}$/i.test(token)) return fail("The cart could not be checked out.");
  if (!isShippingCode(shippingOption)) return fail("Choose a shipping option.");
  if (!origin) return fail("Payment could not be started. Nothing was charged.");

  const orders = await restGet<OrderRow[]>(
    `orders?id=eq.${encodeURIComponent(orderId)}&checkout_token=eq.${encodeURIComponent(token)}&status=eq.pending_payment&payment_status=eq.unpaid&select=id,email,status,payment_status,shipping`,
  );
  const order = orders?.[0];
  if (!order?.email) return fail("The cart could not be checked out.");
  const items = await restGet<ItemRow[]>(
    `order_items?order_id=eq.${encodeURIComponent(orderId)}&select=name,quantity,price,color,selection,product_id`,
  );
  if (!items?.length) return fail("The cart could not be checked out.");

  const region = text(order.shipping?.region).toUpperCase();
  const postal = text(order.shipping?.postal).slice(0, 5);
  const quoted = await quoteTax(region, postal, items);
  if ("error" in quoted) return fail(quoted.error);
  const chosen = await quoteShipping(items.map((item) => item.product_id), shippingOption);
  if ("error" in chosen) return fail(chosen.error);
  const promo = await promoDiscount(text(body.promoCode), quoted.subtotal);
  if ("error" in promo) return fail(promo.error);
  const priced = applyDiscount(quoted.subtotal, quoted.tax, promo.discount);

  const saved = await fetch(
    `${projectUrl()}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&checkout_token=eq.${encodeURIComponent(token)}`,
    {
      method: "PATCH",
      headers: { ...serviceHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        tax_percent: quoted.percent,
        tax_amount: priced.tax,
        shipping_amount: chosen.price,
        shipping_code: shippingOption,
        shipping_name: chosen.name,
        discount_amount: priced.discount,
        promo_code: promo.code,
      }),
    },
  );
  if (!saved.ok) return fail("Sales tax could not be added to this order.");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("payment_method_types[0]", "card");
  form.set("customer_email", order.email);
  form.set("client_reference_id", orderId);
  form.set("metadata[orderId]", orderId);
  form.set("invoice_creation[enabled]", "true");
  form.set("invoice_creation[invoice_data][description]", `Joova order ${orderId}`);
  form.set("invoice_creation[invoice_data][metadata][orderId]", orderId);
  form.set("invoice_creation[invoice_data][footer]", "Joova Tech LLC · Grapevine, Texas");
  form.set("success_url", `${origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/checkout?cancelled=1`);
  form.set("branding_settings[display_name]", "Joova");
  form.set("branding_settings[background_color]", "#F4F4F2");
  form.set("branding_settings[button_color]", "#FF5A05");
  form.set("branding_settings[border_style]", "pill");
  form.set("branding_settings[font_family]", "inter");
  form.set("custom_text[submit][message]", "Secure payment via Stripe. Joova does not store your card number.");

  let index = 0;
  for (const item of items) {
    const detail = purchaseDetail(item);
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(cents(item.price)));
    form.set(`line_items[${index}][price_data][product_data][name]`, item.name.slice(0, 250));
    if (detail) form.set(`line_items[${index}][price_data][product_data][description]`, detail.slice(0, 400));
    index += 1;
  }
  const taxCents = Math.round(priced.tax * 100);
  if (taxCents > 0) {
    form.set(`line_items[${index}][quantity]`, "1");
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(taxCents));
    form.set(`line_items[${index}][price_data][product_data][name]`, `Sales tax (${quoted.label})`.slice(0, 250));
    form.set(`line_items[${index}][price_data][product_data][description]`, `${quoted.regionName} · ${region} ${postal}`.slice(0, 400));
    index += 1;
  }
  const shippingCents = Math.round(chosen.price * 100);
  if (shippingCents > 0) {
    form.set(`line_items[${index}][quantity]`, "1");
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(shippingCents));
    form.set(`line_items[${index}][price_data][product_data][name]`, chosen.name.slice(0, 250));
    form.set(`line_items[${index}][price_data][product_data][description]`, `${chosen.minDays} to ${chosen.maxDays} days`.slice(0, 400));
  }

  let coupon = "";
  if (priced.discount > 0) {
    const couponForm = new URLSearchParams();
    couponForm.set("amount_off", String(Math.round(priced.discount * 100)));
    couponForm.set("currency", "usd");
    couponForm.set("duration", "once");
    couponForm.set("max_redemptions", "1");
    couponForm.set("name", (promo.code ?? "Discount").slice(0, 40));
    const created = await stripeForm("coupons", couponForm);
    const id = created.data && typeof created.data === "object" && "id" in created.data ? String(created.data.id) : "";
    if (!created.ok || !id) return fail("Payment could not be started. Nothing was charged.");
    coupon = id;
    form.set("discounts[0][coupon]", coupon);
  }

  const session = await stripeForm("checkout/sessions", form);
  const sessionId = session.data && typeof session.data === "object" && "id" in session.data ? String(session.data.id) : "";
  const sessionUrl = session.data && typeof session.data === "object" && "url" in session.data ? String(session.data.url ?? "") : "";
  if (!session.ok || !sessionId.startsWith("cs_") || !sessionUrl) {
    return fail("Payment could not be started. Nothing was charged.");
  }
  const attached = await rpc("attach_checkout_session", { p_order: orderId, p_token: token, p_session: sessionId });
  const attachedBody = attached.data as { ok?: boolean } | null;
  if (!attached.ok || attachedBody?.ok !== true) {
    await stripeForm(`checkout/sessions/${sessionId}/expire`, new URLSearchParams());
    return fail("Payment could not be started. Nothing was charged.");
  }
  return Response.json({ url: sessionUrl, orderId, token });
}

async function confirm(sessionId: string) {
  if (!sessionId.startsWith("cs_")) return fail("That payment could not be confirmed.");
  if (!stripeKey()) return Response.json({ found: false });
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${stripeKey()}`, "Stripe-Version": "2026-08-26.dahlia" },
  });
  const session = await response.json().catch(() => null) as { id?: string; payment_status?: string; payment_intent?: string | { id?: string } } | null;
  if (!response.ok || !session || session.id !== sessionId) return Response.json({ found: false });
  const orders = await restGet<OrderRow[]>(
    `orders?checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=id,email,payment_status,confirmation_sent_at,status,shipping`,
  );
  const order = orders?.[0];
  if (!order) return Response.json({ found: false });
  if (session.payment_status === "paid" && order.payment_status !== "paid") {
    const payment = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";
    await rpc("mark_order_paid", { p_session: sessionId, p_payment: payment });
  }
  const again = await restGet<OrderRow[]>(
    `orders?checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=id,email,payment_status,confirmation_sent_at,status,shipping`,
  );
  const current = again?.[0] ?? order;
  return Response.json({
    found: true,
    orderId: current.id,
    paymentStatus: current.payment_status,
    email: current.email ?? "",
    emailSent: Boolean(current.confirmation_sent_at),
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return fail("method", 405);
  let body: { action?: string; sessionId?: string; orderId?: string; token?: string; shippingOption?: string; promoCode?: string; origin?: string };
  try {
    body = await request.json();
  } catch {
    return fail("invalid");
  }
  if (body.action === "confirm") return confirm(text(body.sessionId));
  return start(body);
});
