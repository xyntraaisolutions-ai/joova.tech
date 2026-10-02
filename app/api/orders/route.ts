import { coverageList } from "@/lib/catalog/coverage";
import { linkedOrderId } from "@/lib/orders/origin";
import { NextRequest, NextResponse } from "next/server";
import { ordersForUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ orders: [], pageSize: 10 });
    const [listed, claims] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, payment_status, subtotal, discount_amount, promo_code, created_at, guest, order_kind, order_items(id, product_id, name, quantity, price, color, selection, coverage), shipments(carrier, tracking_number, status, delivered_at), returns!returns_order_id_fkey(id, status, reason, resolution, decision_note, customer_reply, replacement_carrier, replacement_tracking, replacement_order_id, requested_at), warranty_registrations(product_id, serial, coverage_ends_at), warranty_claims!orders_source_claim_id_fkey(order_id), source_return:returns!orders_source_return_id_fkey(order_id)")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false }),
      supabase.from("warranty_claims").select("id, order_id, status, message").eq("user_id", auth.user.id),
    ]);
    if (listed.error) return NextResponse.json({ error: "Orders could not be loaded." }, { status: 400 });
    const data = listed.data;
    const claimRows = claims.data ?? [];
    const orders = (data ?? []).map((order) => ({
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount_amount ?? 0),
      promoCode: order.promo_code,
      createdAt: order.created_at,
      guest: order.guest,
      items: (order.order_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        color: item.color ?? undefined,
        selection: item.selection && typeof item.selection === "object" ? item.selection : undefined,
        coverage: coverageList(item.coverage),
      })),
      shipments: order.shipments ?? [],
      returns: order.returns ?? [],
      registrations: order.warranty_registrations ?? [],
      claims: claimRows.filter((claim) => claim.order_id === order.id),
      orderKind: order.order_kind === "warranty" || order.order_kind === "exchange" ? order.order_kind : "sale",
      sourceOrderId: order.order_kind === "warranty"
        ? linkedOrderId(order.warranty_claims)
        : order.order_kind === "exchange"
          ? linkedOrderId(order.source_return)
          : "",
    }));
    const settings = await supabase.from("site_settings").select("list_page_size").eq("id", 1).maybeSingle();
    const pageSize = Math.min(100, Math.max(1, Number(settings.data?.list_page_size) || 10));
    return NextResponse.json({ orders, pageSize });
  }

  const user = await userFromToken(sessionToken(request));
  if (!user) {
    return NextResponse.json({ orders: [] });
  }
  return NextResponse.json({ orders: await ordersForUser(user.id), pageSize: 10 });
}
