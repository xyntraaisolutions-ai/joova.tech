import { NextRequest, NextResponse } from "next/server";
import { ordersForUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ orders: [] });
    const [{ data }, claims] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, payment_status, subtotal, created_at, guest, order_items(id, product_id, name, quantity, price, color, selection), shipments(carrier, tracking_number, status, delivered_at), returns(status), warranty_registrations(product_id, serial, coverage_ends_at)")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false }),
      supabase.from("warranty_claims").select("id, order_id, status, message").eq("user_id", auth.user.id),
    ]);
    const claimRows = claims.data ?? [];
    const orders = (data ?? []).map((order) => ({
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
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
      })),
      shipments: order.shipments ?? [],
      returns: order.returns ?? [],
      registrations: order.warranty_registrations ?? [],
      claims: claimRows.filter((claim) => claim.order_id === order.id),
    }));
    return NextResponse.json({ orders });
  }

  const user = await userFromToken(sessionToken(request));
  if (!user) {
    return NextResponse.json({ orders: [] });
  }
  return NextResponse.json({ orders: await ordersForUser(user.id) });
}
