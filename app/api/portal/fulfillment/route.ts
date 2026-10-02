import { NextResponse } from "next/server";
import { z } from "zod";
import { sendReviewRequestEmail } from "@/lib/mail/notices";
import { sendShipmentEmail } from "@/lib/mail/order";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const orderSelect =
  "id, email, status, payment_status, subtotal, created_at, stock_committed_at, shipping, order_kind, order_items(id, product_id, name, quantity, price, color, selection), shipments(id, carrier, tracking_number, status, shipped_at, delivered_at), warranty_claims!orders_source_claim_id_fkey(order_id), source_return:returns!orders_source_return_id_fkey(order_id)";
const returnSelect =
  "id, order_id, email, reason, resolution, status, decision_note, customer_reply, requested_at, reviewed_at, received_at, orders!returns_order_id_fkey(id, email, subtotal, shipping, order_items(name, quantity, color, selection))";

const stages = {
  open: ["pending_payment", "preparing"],
  shipped: ["shipped", "out_for_delivery"],
  delivered: ["delivered"],
} as const;

export async function GET(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const safe = q.replace(/[%_,().*\\]/g, "");
  const stage = url.searchParams.get("stage") ?? "open";
  const allowed = stage in stages ? stages[stage as keyof typeof stages] : null;

  if (stage === "returns") {
    let listed = session.supabase.from("returns").select(returnSelect).is("deleted_at", null).in("status", ["approved", "received"]);
    if (safe) listed = listed.or(`order_id.ilike.%${safe}%,email.ilike.%${safe}%,reason.ilike.%${safe}%`);
    const rows = await listed.order("reviewed_at", { ascending: true }).limit(50);
    if (rows.error) return NextResponse.json({ error: "Returns could not be loaded." }, { status: 400 });
    const [waiting, received] = await Promise.all([
      session.supabase.from("returns").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "approved"),
      session.supabase.from("returns").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "received"),
    ]);
    return NextResponse.json({
      returns: rows.data ?? [],
      returnCounts: { approved: waiting.count ?? 0, received: received.count ?? 0 },
    });
  }

  let query = session.supabase.from("orders").select(orderSelect).is("deleted_at", null).eq("payment_status", "paid");
  if (allowed) query = query.in("status", [...allowed]);
  if (safe) query = query.or(`id.ilike.%${safe}%,email.ilike.%${safe}%`);
  const orders = await query.order("created_at", { ascending: false }).limit(50);
  if (orders.error) return NextResponse.json({ error: "Orders could not be loaded." }, { status: 400 });

  async function count(statuses: readonly string[] | null) {
    let counted = session.supabase.from("orders").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("payment_status", "paid");
    if (statuses) counted = counted.in("status", [...statuses]);
    if (safe) counted = counted.or(`id.ilike.%${safe}%,email.ilike.%${safe}%`);
    const result = await counted;
    return result.count ?? 0;
  }
  const [open, shipped, delivered, all, products] = await Promise.all([
    count(stages.open),
    count(stages.shipped),
    count(stages.delivered),
    count(null),
    session.supabase.from("products").select("id", { count: "exact", head: true }).then((result) => result.count ?? 0),
  ]);
  return NextResponse.json({
    orders: orders.data ?? [],
    counts: { open, shipped, delivered, all, products },
  });
}

const shipSchema = z.object({
  order: z.string().trim().min(1).max(40),
  carrier: z.string().trim().max(80),
  tracking: z.string().trim().max(80),
  status: z.enum(["preparing", "shipped", "out_for_delivery", "delivered"]),
});
const returnSchema = z.object({ action: z.literal("receive"), id: z.uuid() });

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const json = await request.json().catch(() => null);
  const returning = returnSchema.safeParse(json);
  if (returning.success) {
    const received = await session.supabase.rpc("fulfill_receive_return", {
      p_id: returning.data.id,
      p_view_as: viewAs,
    });
    const receivedBody = received.data as { ok?: boolean; error?: string } | null;
    const receivedError = rpcFailed(receivedBody, received.error);
    if (receivedError) return NextResponse.json({ error: receivedError }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const parsed = shipSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Check the shipment details." }, { status: 400 });
  const { data, error } = await session.supabase.rpc("fulfill_order", {
    p_order: parsed.data.order,
    p_carrier: parsed.data.carrier,
    p_tracking: parsed.data.tracking,
    p_status: parsed.data.status,
    p_view_as: viewAs,
  });
  const result = data as { ok?: boolean; error?: string; email?: string; shipped?: boolean; delivered?: boolean } | null;
  const message = rpcFailed(result, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  const orderId = parsed.data.order.trim().toUpperCase();
  if (result?.shipped && result.email && parsed.data.tracking) {
    const mailed = await sendShipmentEmail({
      email: result.email,
      orderId,
      carrier: parsed.data.carrier,
      tracking: parsed.data.tracking,
    });
    if (!mailed) {
      return NextResponse.json({ ok: true, emailError: "The order shipped. The tracking email could not be sent." });
    }
  }
  if (result?.delivered && result.email && isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const prior = await admin.from("orders").select("review_requested_at").eq("id", orderId).maybeSingle();
    if (!prior.data?.review_requested_at) {
      const mailed = await sendReviewRequestEmail({ email: result.email, orderId });
      if (mailed) {
        await admin.from("orders").update({ review_requested_at: new Date().toISOString() }).eq("id", orderId);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
