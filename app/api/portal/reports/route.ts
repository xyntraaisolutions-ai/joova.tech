import { NextResponse } from "next/server";
import { requirePortalApi } from "@/lib/portal/api";

function chicagoStamp(day: string, time: string) {
  const named = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "longOffset",
  }).format(new Date(`${day}T${time}Z`));
  const match = named.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match?.[1] ?? "-";
  const hours = String(match ? Number(match[2]) : 6).padStart(2, "0");
  const minutes = match?.[3] ?? "00";
  return `${day}T${time}${sign}${hours}:${minutes}`;
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: "Choose a start and end date." }, { status: 400 });
  }
  const { supabase } = gate.session;
  const orders = await supabase
    .from("orders")
    .select("id, subtotal, tax_amount, shipping_amount, discount_amount")
    .eq("payment_status", "paid")
    .eq("order_kind", "sale")
    .is("deleted_at", null)
    .gte("created_at", chicagoStamp(from, "00:00:00"))
    .lte("created_at", chicagoStamp(to, "23:59:59"));
  if (orders.error) return NextResponse.json({ error: "Sales could not be loaded." }, { status: 400 });
  const refunds = await supabase
    .from("returns")
    .select("order_id, orders!returns_order_id_fkey(subtotal, tax_amount, shipping_amount, discount_amount)")
    .or("status.eq.refunded,and(status.eq.closed,resolution.eq.refund)")
    .is("deleted_at", null)
    .gte("refunded_at", chicagoStamp(from, "00:00:00"))
    .lte("refunded_at", chicagoStamp(to, "23:59:59"));
  if (refunds.error) return NextResponse.json({ error: "Refunds could not be loaded." }, { status: 400 });

  const rows = orders.data ?? [];
  const sum = (key: "subtotal" | "tax_amount" | "shipping_amount" | "discount_amount") =>
    Math.round(rows.reduce((total, row) => total + Number(row[key] ?? 0), 0) * 100) / 100;
  const seen = new Set<string>();
  let refunded = 0;
  for (const row of refunds.data ?? []) {
    if (!row.order_id || seen.has(row.order_id)) continue;
    seen.add(row.order_id);
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    if (!order) continue;
    refunded += Number(order.subtotal ?? 0) - Number(order.discount_amount ?? 0) + Number(order.tax_amount ?? 0) + Number(order.shipping_amount ?? 0);
  }
  return NextResponse.json({
    from,
    to,
    orders: rows.length,
    merchandise: sum("subtotal"),
    discounts: sum("discount_amount"),
    tax: sum("tax_amount"),
    shipping: sum("shipping_amount"),
    refunds: Math.round(refunded * 100) / 100,
    refundCount: seen.size,
  });
}
