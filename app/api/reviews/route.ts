import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const bodySchema = z.object({
  orderId: z.string().trim().min(1).max(40),
  email: z.email(),
  productId: z.string().trim().min(1).max(40),
  author: z.string().trim().min(1).max(80),
  body: z.string().trim().min(12).max(2000),
});

export async function GET(request: Request) {
  if (!isServiceRoleConfigured()) return NextResponse.json({ products: [] });
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order")?.trim().toUpperCase() ?? "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!orderId || !email.includes("@")) return NextResponse.json({ products: [] });
  const admin = createAdminClient();
  const order = await admin
    .from("orders")
    .select("email, status, order_items(product_id, name)")
    .eq("id", orderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!order.data || order.data.email?.toLowerCase() !== email || order.data.status !== "delivered") {
    return NextResponse.json({ products: [] });
  }
  const products = new Map<string, string>();
  for (const item of order.data.order_items ?? []) {
    if (item.product_id) products.set(item.product_id, item.name);
  }
  return NextResponse.json({
    products: [...products.entries()].map(([id, name]) => ({ id, name })),
  });
}

export async function POST(request: Request) {
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Reviews are not available right now." }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the review and try again." }, { status: 400 });
  const admin = createAdminClient();
  const orderId = parsed.data.orderId.trim().toUpperCase();
  const email = parsed.data.email.trim().toLowerCase();
  const order = await admin
    .from("orders")
    .select("email, status, order_items(product_id)")
    .eq("id", orderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!order.data || order.data.email?.toLowerCase() !== email) {
    return NextResponse.json({ error: "That order does not match this email." }, { status: 400 });
  }
  if (order.data.status !== "delivered") {
    return NextResponse.json({ error: "A review can be sent after the order is delivered." }, { status: 400 });
  }
  const owns = (order.data.order_items ?? []).some((item) => item.product_id === parsed.data.productId);
  if (!owns) return NextResponse.json({ error: "That item is not on this order." }, { status: 400 });
  const existing = await admin.from("reviews").select("id").eq("order_id", orderId).eq("product_id", parsed.data.productId).is("deleted_at", null).maybeSingle();
  if (existing.data) return NextResponse.json({ error: "A review for that item is already waiting." }, { status: 400 });
  const saved = await admin.from("reviews").insert({
    product_id: parsed.data.productId,
    order_id: orderId,
    author: parsed.data.author,
    body: parsed.data.body,
    verified: true,
    published: false,
  });
  if (saved.error) return NextResponse.json({ error: "The review could not be saved." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
