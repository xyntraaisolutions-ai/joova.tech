import { NextResponse } from "next/server";
import { z } from "zod";
import { sendReviewRequestEmail } from "@/lib/mail/notices";
import { resendOrderConfirmation, sendShipmentEmail, type PaidOrder } from "@/lib/mail/order";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";
import { refundReturn } from "@/lib/portal/refund";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const orderSelect =
  "id, email, user_id, status, payment_status, subtotal, tax_percent, tax_amount, shipping_amount, shipping_name, discount_amount, promo_code, shipping, created_at, deleted_at, checkout_session_id, stripe_invoice_id, order_items(id, product_id, name, quantity, price, color, selection), shipments(id, carrier, tracking_number, status, delivered_at), returns(id, status, reason, deleted_at), warranty_registrations(id, product_id, serial, coverage_ends_at, deleted_at)";

const customerSelect = "id, name, email, active, support_note, created_at, deleted_at";
const messageSelect = "id, name, email, message, status, reply, kind, created_at, deleted_at";
const claimSelect = "id, user_id, name, email, order_id, product_id, serial, message, status, created_at, deleted_at";

function paidOrder(row: {
  id: string;
  email: string;
  subtotal: number | string | null;
  tax_percent?: number | string | null;
  tax_amount?: number | string | null;
  shipping_amount?: number | string | null;
  shipping_name?: string | null;
  discount_amount?: number | string | null;
  promo_code?: string | null;
  shipping: PaidOrder["shipping"] | null;
  created_at?: string | null;
  payment_status?: string | null;
  checkout_session_id?: string | null;
  stripe_invoice_id?: string | null;
  order_items: PaidOrder["items"] | null;
}): PaidOrder {
  return {
    orderId: row.id,
    email: row.email,
    subtotal: row.subtotal ?? 0,
    taxPercent: row.tax_percent,
    taxAmount: row.tax_amount,
    shippingAmount: row.shipping_amount,
    shippingName: row.shipping_name,
    discountAmount: row.discount_amount,
    promoCode: row.promo_code,
    shipping: row.shipping ?? {},
    items: row.order_items ?? [],
    createdAt: row.created_at ?? undefined,
    paid: row.payment_status === "paid",
    checkoutSessionId: row.checkout_session_id,
    stripeInvoiceId: row.stripe_invoice_id,
  };
}

function searchTerms(raw: string) {
  const safe = raw.trim().slice(0, 80).replace(/[%(),.*\\]/g, "");
  if (!safe) return [];
  const status = safe.replace(/\s+/g, "_");
  return [...new Set(status === safe ? [safe] : [safe, status])];
}

function anyIlike(columns: string[], terms: string[]) {
  return terms.flatMap((term) => columns.map((column) => `${column}.ilike.%${term}%`)).join(",");
}

function textValues(rows: Record<string, unknown>[], column: string) {
  return [...new Set(rows.map((row) => row[column]).filter((value): value is string => typeof value === "string" && value.length > 0 && !value.includes(",")))];
}

async function loadRows(
  run: () => PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  const listed = await run();
  if (listed.error) return { error: listed.error.message, rows: [] as Record<string, unknown>[] };
  const rows = Array.isArray(listed.data)
    ? listed.data.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    : [];
  return { error: "", rows };
}

const orderSteps = ["pending_payment", "preparing", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;
type OrderStep = (typeof orderSteps)[number];

function orderStep(url: URL, key: string): OrderStep {
  const value = url.searchParams.get(key) ?? "";
  return orderSteps.includes(value as OrderStep) ? (value as OrderStep) : "pending_payment";
}

function pageNumber(url: URL, key: string) {
  const value = Number(url.searchParams.get(key) ?? "1");
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

type Listed<T> = { rows: T[]; total: number; page: number; pages: number; open?: number };

async function readPage<T>(
  count: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  rows: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  requested: number,
  pageSize: number,
): Promise<Listed<T> & { error?: string }> {
  const counted = await count;
  if (counted.error) return { error: counted.error.message, rows: [], total: 0, page: 1, pages: 1 };
  const total = counted.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pages);
  if (total === 0) return { rows: [], total: 0, page: 1, pages: 1 };
  const from = (page - 1) * pageSize;
  const listed = await rows(from, from + pageSize - 1);
  if (listed.error) return { error: listed.error.message, rows: [], total: 0, page: 1, pages: 1 };
  return { rows: listed.data ?? [], total, page, pages };
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["support"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const terms = searchTerms(q);
  const customerId = url.searchParams.get("customer")?.trim() ?? "";
  const settings = await session.supabase.from("site_settings").select("list_page_size").eq("id", 1).maybeSingle();
  const pageSize = Math.min(100, Math.max(1, Number(settings.data?.list_page_size) || 10));
  const db = session.supabase;

  let customerIds: string[] | null = null;
  let messageIds: string[] | null = null;
  let orderIds: string[] | null = null;
  let claimIds: string[] | null = null;
  if (terms.length) {
    const [profiles, messages, claims, orders, items, shipments, returns, registrations] = await Promise.all([
      loadRows(() => db.from("profiles").select("id, email").eq("role", "customer").or(anyIlike(["name", "email", "support_note"], terms)).limit(400)),
      loadRows(() => db.from("contact_messages").select("id, email").or(anyIlike(["name", "email", "message", "reply", "status"], terms)).limit(400)),
      loadRows(() => db.from("warranty_claims").select("id, email, user_id").or(anyIlike(["name", "email", "order_id", "product_id", "serial", "message", "status"], terms)).limit(400)),
      loadRows(() => db.from("orders").select("id, email, user_id").or(anyIlike(["id", "email", "status", "payment_status", "shipping->>name", "shipping->>line1", "shipping->>line2", "shipping->>city", "shipping->>region", "shipping->>postal"], terms)).limit(400)),
      loadRows(() => db.from("order_items").select("order_id").or(anyIlike(["name", "product_id", "color", "selection->>sku", "selection->>color", "selection->>type", "selection->>size", "selection->>custom"], terms)).limit(400)),
      loadRows(() => db.from("shipments").select("order_id").or(anyIlike(["carrier", "tracking_number", "status"], terms)).limit(400)),
      loadRows(() => db.from("returns").select("order_id, email").or(anyIlike(["reason", "status", "email"], terms)).limit(400)),
      loadRows(() => db.from("warranty_registrations").select("order_id").or(anyIlike(["product_id", "serial"], terms)).limit(400)),
    ]);
    const failed = [profiles, messages, claims, orders, items, shipments, returns, registrations].find((result) => result.error);
    if (failed?.error) return NextResponse.json({ error: "Search could not be completed." }, { status: 400 });

    const linkedOrderIds = [...new Set([
      ...textValues(items.rows, "order_id"),
      ...textValues(shipments.rows, "order_id"),
      ...textValues(returns.rows, "order_id"),
      ...textValues(registrations.rows, "order_id"),
    ])];
    const knownOrders = new Set(textValues(orders.rows, "id"));
    const missingOrders = linkedOrderIds.filter((id) => !knownOrders.has(id));
    const extraOrders = missingOrders.length
      ? await loadRows(() => db.from("orders").select("id, email, user_id").in("id", missingOrders).limit(400))
      : { error: "", rows: [] as Record<string, unknown>[] };
    if (extraOrders.error) return NextResponse.json({ error: "Search could not be completed." }, { status: 400 });

    const matchedOrders = [...orders.rows, ...extraOrders.rows];
    const emails = [...new Set([
      ...textValues(profiles.rows, "email"),
      ...textValues(messages.rows, "email"),
      ...textValues(claims.rows, "email"),
      ...textValues(returns.rows, "email"),
      ...textValues(matchedOrders, "email"),
    ])];
    const userIds = [...new Set([
      ...textValues(profiles.rows, "id"),
      ...textValues(claims.rows, "user_id"),
      ...textValues(matchedOrders, "user_id"),
    ])];
    const peopleFilter = [
      userIds.length ? `id.in.(${userIds.join(",")})` : "",
      emails.length ? `email.in.(${emails.join(",")})` : "",
    ].filter(Boolean).join(",");
    const people = peopleFilter
      ? await loadRows(() => db.from("profiles").select("id, email").eq("role", "customer").or(peopleFilter).limit(400))
      : { error: "", rows: [] as Record<string, unknown>[] };
    if (people.error) return NextResponse.json({ error: "Search could not be completed." }, { status: 400 });

    customerIds = textValues(people.rows, "id");
    const peopleEmails = textValues(people.rows, "email").map((email) => email.toLowerCase());
    const ownedFilter = [
      customerIds.length ? `user_id.in.(${customerIds.join(",")})` : "",
      peopleEmails.length ? `email.in.(${peopleEmails.join(",")})` : "",
    ].filter(Boolean).join(",");
    const [ownedOrders, ownedMessages, ownedClaims] = ownedFilter
      ? await Promise.all([
          loadRows(() => db.from("orders").select("id").or(ownedFilter).limit(400)),
          peopleEmails.length
            ? loadRows(() => db.from("contact_messages").select("id").in("email", peopleEmails).limit(400))
            : Promise.resolve({ error: "", rows: [] as Record<string, unknown>[] }),
          loadRows(() => db.from("warranty_claims").select("id").or(ownedFilter).limit(400)),
        ])
      : [
          { error: "", rows: [] as Record<string, unknown>[] },
          { error: "", rows: [] as Record<string, unknown>[] },
          { error: "", rows: [] as Record<string, unknown>[] },
        ];
    if (ownedOrders.error || ownedMessages.error || ownedClaims.error) {
      return NextResponse.json({ error: "Search could not be completed." }, { status: 400 });
    }
    orderIds = [...new Set([...textValues(matchedOrders, "id"), ...textValues(ownedOrders.rows, "id")])];
    messageIds = [...new Set([...textValues(messages.rows, "id"), ...textValues(ownedMessages.rows, "id")])];
    claimIds = [...new Set([...textValues(claims.rows, "id"), ...textValues(ownedClaims.rows, "id")])];
  }

  const customers = customerIds && customerIds.length === 0
    ? { rows: [], total: 0, page: 1, pages: 1 }
    : await readPage(
        (customerIds
          ? session.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").in("id", customerIds)
          : session.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer")),
        (from, to) => {
          const query = session.supabase.from("profiles").select(customerSelect).eq("role", "customer");
          return (customerIds ? query.in("id", customerIds) : query).order("created_at", { ascending: false }).range(from, to);
        },
        pageNumber(url, "customersPage"),
        pageSize,
      );
  if (customers.error) return NextResponse.json({ error: "Customers could not be loaded." }, { status: 400 });

  const messages = messageIds && messageIds.length === 0
    ? { rows: [], total: 0, page: 1, pages: 1 }
    : await readPage(
        (messageIds
          ? session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).neq("kind", "customer_request").in("id", messageIds)
          : session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).neq("kind", "customer_request")),
        (from, to) => {
          const query = session.supabase.from("contact_messages").select(messageSelect).neq("kind", "customer_request");
          return (messageIds ? query.in("id", messageIds) : query).order("created_at", { ascending: false }).range(from, to);
        },
        pageNumber(url, "messagesPage"),
        pageSize,
      );
  if (messages.error) return NextResponse.json({ error: "Messages could not be loaded." }, { status: 400 });
  const openMessages = messageIds && messageIds.length === 0
    ? { count: 0 }
    : await (messageIds
      ? session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open").is("deleted_at", null).neq("kind", "customer_request").in("id", messageIds)
      : session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open").is("deleted_at", null).neq("kind", "customer_request"));

  const requests = messageIds && messageIds.length === 0
    ? { rows: [], total: 0, page: 1, pages: 1 }
    : await readPage(
        (messageIds
          ? session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("kind", "customer_request").in("id", messageIds)
          : session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("kind", "customer_request")),
        (from, to) => {
          const query = session.supabase.from("contact_messages").select(messageSelect).eq("kind", "customer_request");
          return (messageIds ? query.in("id", messageIds) : query).order("created_at", { ascending: false }).range(from, to);
        },
        pageNumber(url, "requestsPage"),
        pageSize,
      );
  if (requests.error) return NextResponse.json({ error: "Customer requests could not be loaded." }, { status: 400 });
  const openRequests = messageIds && messageIds.length === 0
    ? { count: 0 }
    : await (messageIds
      ? session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open").is("deleted_at", null).eq("kind", "customer_request").in("id", messageIds)
      : session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open").is("deleted_at", null).eq("kind", "customer_request"));

  const ordersStatus = orderStep(url, "ordersStatus");
  const orderCounts = Object.fromEntries(
    await Promise.all(orderSteps.map(async (status) => {
      if (orderIds && orderIds.length === 0) return [status, 0] as const;
      const counted = orderIds
        ? await session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status).in("id", orderIds)
        : await session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status);
      return [status, counted.count ?? 0] as const;
    })),
  );
  const orders = orderIds && orderIds.length === 0
    ? { rows: [], total: 0, page: 1, pages: 1 }
    : await readPage(
        (orderIds
          ? session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", ordersStatus).in("id", orderIds)
          : session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", ordersStatus)),
        (from, to) => {
          const query = session.supabase.from("orders").select(orderSelect).eq("status", ordersStatus);
          return (orderIds ? query.in("id", orderIds) : query).order("created_at", { ascending: false }).range(from, to);
        },
        pageNumber(url, "ordersPage"),
        pageSize,
      );
  if (orders.error) return NextResponse.json({ error: "Orders could not be loaded." }, { status: 400 });

  const claims = claimIds && claimIds.length === 0
    ? { rows: [], total: 0, page: 1, pages: 1 }
    : await readPage(
        (claimIds
          ? session.supabase.from("warranty_claims").select("id", { count: "exact", head: true }).in("id", claimIds)
          : session.supabase.from("warranty_claims").select("id", { count: "exact", head: true })),
        (from, to) => {
          const query = session.supabase.from("warranty_claims").select(claimSelect);
          return (claimIds ? query.in("id", claimIds) : query).order("created_at", { ascending: false }).range(from, to);
        },
        pageNumber(url, "claimsPage"),
        pageSize,
      );
  if (claims.error) return NextResponse.json({ error: "Warranty claims could not be loaded." }, { status: 400 });
  const emails = [...new Set(
    [...messages.rows, ...requests.rows, ...orders.rows, ...claims.rows]
      .map((row) => ("email" in row && typeof row.email === "string" ? row.email.trim().toLowerCase() : ""))
      .filter((email) => email.includes("@")),
  )].slice(0, 80);
  const people = emails.length
    ? await session.supabase.from("profiles").select("id, name, email").eq("role", "customer").in("email", emails)
    : { data: [] as { id: string; name: string; email: string }[], error: null };
  if (people.error) return NextResponse.json({ error: "Customers could not be loaded." }, { status: 400 });
  const openClaims = claimIds && claimIds.length === 0
    ? { count: 0 }
    : await (claimIds
      ? session.supabase.from("warranty_claims").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]).is("deleted_at", null).in("id", claimIds)
      : session.supabase.from("warranty_claims").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]).is("deleted_at", null));

  let account = null;
  if (z.uuid().safeParse(customerId).success) {
    const profile = await session.supabase.from("profiles").select(customerSelect).eq("id", customerId).eq("role", "customer").maybeSingle();
    if (profile.error) return NextResponse.json({ error: "That customer could not be loaded." }, { status: 400 });
    if (profile.data) {
      const email = profile.data.email.replace(/[%_,]/g, "");
      const accountFilter = `user_id.eq.${profile.data.id},email.ilike.${email}`;
      const accountMessages = messageIds && messageIds.length === 0
        ? { rows: [], total: 0, page: 1, pages: 1 }
        : await readPage(
            (messageIds
              ? session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).ilike("email", email).in("id", messageIds)
              : session.supabase.from("contact_messages").select("id", { count: "exact", head: true }).ilike("email", email)),
            (from, to) => {
              const query = session.supabase.from("contact_messages").select(messageSelect).ilike("email", email);
              return (messageIds ? query.in("id", messageIds) : query).order("created_at", { ascending: false }).range(from, to);
            },
            pageNumber(url, "accountMessagesPage"),
            pageSize,
          );
      const accountOrdersStatus = orderStep(url, "accountOrdersStatus");
      const accountOrderCounts = Object.fromEntries(
        await Promise.all(orderSteps.map(async (status) => {
          if (orderIds && orderIds.length === 0) return [status, 0] as const;
          const counted = orderIds
            ? await session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status).or(accountFilter).in("id", orderIds)
            : await session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status).or(accountFilter);
          return [status, counted.count ?? 0] as const;
        })),
      );
      const accountOrders = orderIds && orderIds.length === 0
        ? { rows: [], total: 0, page: 1, pages: 1 }
        : await readPage(
            (orderIds
              ? session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", accountOrdersStatus).or(accountFilter).in("id", orderIds)
              : session.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", accountOrdersStatus).or(accountFilter)),
            (from, to) => {
              const query = session.supabase.from("orders").select(orderSelect).eq("status", accountOrdersStatus).or(accountFilter);
              return (orderIds ? query.in("id", orderIds) : query).order("created_at", { ascending: false }).range(from, to);
            },
            pageNumber(url, "accountOrdersPage"),
            pageSize,
          );
      const accountClaims = claimIds && claimIds.length === 0
        ? { rows: [], total: 0, page: 1, pages: 1 }
        : await readPage(
            (claimIds
              ? session.supabase.from("warranty_claims").select("id", { count: "exact", head: true }).or(accountFilter).in("id", claimIds)
              : session.supabase.from("warranty_claims").select("id", { count: "exact", head: true }).or(accountFilter)),
            (from, to) => {
              const query = session.supabase.from("warranty_claims").select(claimSelect).or(accountFilter);
              return (claimIds ? query.in("id", claimIds) : query).order("created_at", { ascending: false }).range(from, to);
            },
            pageNumber(url, "accountClaimsPage"),
            pageSize,
          );
      if (accountMessages.error || accountOrders.error || accountClaims.error) {
        return NextResponse.json({ error: "That customer record could not be loaded." }, { status: 400 });
      }
      account = { customer: profile.data, messages: accountMessages, orders: accountOrders, claims: accountClaims, orderCounts: accountOrderCounts };
      if (url.searchParams.get("opened") === "1") {
        await session.supabase.rpc("record_audit", {
          p_action: "open_customer",
          p_entity: "profiles",
          p_entity_id: profile.data.id,
          p_detail: {},
          p_view_as: viewAs,
        });
      }
    }
  }

  return NextResponse.json({
    pageSize,
    customers,
    messages: { ...messages, open: openMessages.count ?? 0 },
    requests: { ...requests, open: openRequests.count ?? 0 },
    orders,
    orderCounts,
    claims: { ...claims, open: openClaims.count ?? 0 },
    account,
    people: people.data ?? [],
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("customer"),
    id: z.uuid(),
    name: z.string().trim().min(1).max(80),
    note: z.string().trim().max(2000),
  }),
  z.object({
    action: z.literal("shipment"),
    order: z.string().trim().min(1).max(40),
    carrier: z.string().trim().max(80),
    tracking: z.string().trim().max(80),
    status: z.enum(["preparing", "shipped", "out_for_delivery", "delivered"]),
  }),
  z.object({
    action: z.literal("return"),
    id: z.uuid(),
    status: z.enum(["requested", "approved", "received", "refunded", "closed"]),
  }),
  z.object({
    action: z.literal("claim"),
    id: z.uuid(),
    status: z.enum(["open", "reviewing", "approved", "replaced", "closed"]),
  }),
  z.object({
    action: z.literal("reply"),
    id: z.uuid(),
    reply: z.string().trim().min(1).max(4000),
    status: z.enum(["replied", "closed"]),
  }),
  z.object({
    action: z.literal("warranty"),
    userId: z.uuid(),
    order: z.string().trim().min(1).max(40),
    productId: z.string().trim().min(1).max(40),
    serial: z.string().trim().max(80).optional(),
  }),
  z.object({
    action: z.literal("resend"),
    order: z.string().trim().min(1).max(40),
  }),
  z.object({
    action: z.literal("fileClaim"),
    userId: z.uuid(),
    order: z.string().trim().min(1).max(40),
    productId: z.string().trim().min(1).max(40),
    serial: z.string().trim().max(80).optional(),
    message: z.string().trim().min(3).max(4000),
  }),
]);

export async function POST(request: Request) {
  const gate = await requirePortalApi(["support"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the support form." }, { status: 400 });
  const body = parsed.data;
  if (body.action === "return" && body.status === "refunded") {
    const refunded = await refundReturn(session.supabase, viewAs, body.id);
    if ("error" in refunded) return NextResponse.json({ error: refunded.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "resend") {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: "The confirmation email is not ready yet." }, { status: 503 });
    }
    const found = await session.supabase.from("orders").select(orderSelect).eq("id", body.order).maybeSingle();
    if (found.error || !found.data) return NextResponse.json({ error: "That order could not be loaded." }, { status: 400 });
    const row = found.data;
    if (row.payment_status !== "paid") {
      return NextResponse.json({ error: "Confirmation is sent after the order is paid." }, { status: 400 });
    }
    if (!row.email) return NextResponse.json({ error: "This order has no customer email." }, { status: 400 });
    const sent = await resendOrderConfirmation(paidOrder(row));
    if (!sent) return NextResponse.json({ error: "The confirmation email could not be sent." }, { status: 502 });
    await session.supabase.rpc("record_audit", {
      p_action: "resend_order_email",
      p_entity: "orders",
      p_entity_id: row.id,
      p_detail: { email: row.email },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const priorShipment = body.action === "shipment"
    ? await session.supabase.from("orders").select("status, email, review_requested_at").eq("id", body.order.trim().toUpperCase()).maybeSingle()
    : null;
  const call =
    body.action === "customer"
      ? session.supabase.rpc("csr_update_customer", {
          p_id: body.id,
          p_name: body.name,
          p_note: body.note,
          p_view_as: viewAs,
        })
      : body.action === "shipment"
        ? session.supabase.rpc("support_set_shipment", {
            p_order: body.order,
            p_carrier: body.carrier,
            p_tracking: body.tracking,
            p_status: body.status,
            p_view_as: viewAs,
          })
        : body.action === "return"
          ? session.supabase.rpc("support_set_return", { p_id: body.id, p_status: body.status, p_view_as: viewAs })
          : body.action === "claim"
            ? session.supabase.rpc("support_set_claim", { p_id: body.id, p_status: body.status, p_view_as: viewAs })
            : body.action === "reply"
              ? session.supabase.rpc("support_reply", {
                  p_id: body.id,
                  p_reply: body.reply,
                  p_status: body.status,
                  p_view_as: viewAs,
                })
              : body.action === "warranty"
                ? session.supabase.rpc("support_register_warranty", {
                    p_user: body.userId,
                    p_order: body.order,
                    p_product: body.productId,
                    p_serial: body.serial ?? "",
                    p_view_as: viewAs,
                  })
                : session.supabase.rpc("support_file_claim", {
                    p_user: body.userId,
                    p_order: body.order,
                    p_product: body.productId,
                    p_serial: body.serial ?? "",
                    p_message: body.message,
                    p_view_as: viewAs,
                  });
  const { data, error } = await call;
  const message = rpcFailed(data as { ok?: boolean; error?: string } | null, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  if (body.action === "shipment" && priorShipment?.data?.email) {
    const orderId = body.order.trim().toUpperCase();
    const previous = priorShipment.data.status;
    if (previous !== "shipped" && body.status === "shipped" && body.tracking) {
      const mailed = await sendShipmentEmail({
        email: priorShipment.data.email,
        orderId,
        carrier: body.carrier,
        tracking: body.tracking,
      });
      if (!mailed) return NextResponse.json({ ok: true, emailError: "The shipment was saved. The tracking email could not be sent." });
    }
    if (previous !== "delivered" && body.status === "delivered" && !priorShipment.data.review_requested_at && isServiceRoleConfigured()) {
      const mailed = await sendReviewRequestEmail({ email: priorShipment.data.email, orderId });
      if (mailed) {
        await createAdminClient().from("orders").update({ review_requested_at: new Date().toISOString() }).eq("id", orderId);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
