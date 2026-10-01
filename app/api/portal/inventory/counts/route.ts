import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";
import { readAvailable, syncAvailability } from "@/lib/portal/availability";

const metrics = ["lifetime", "on_hand", "orders_received", "shipping", "delivery", "delivered", "available", "returns", "warranty_sent"] as const;

const batchSchema = z.object({
  kind: z.literal("batch"),
  productId: z.string().trim().min(1).max(40),
  batchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference: z.string().trim().max(80),
  quantity: z.number().int().min(1).max(100000),
  note: z.string().trim().max(200),
});

const adjustSchema = z.object({
  kind: z.literal("adjust"),
  productId: z.string().trim().min(1).max(40),
  metric: z.enum(metrics),
  next: z.number().int().min(0).max(1000000),
  reason: z.string().trim().min(3).max(300),
});

export async function GET() {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { data, error } = await gate.session.supabase.rpc("inventory_counter");
  const message = rpcFailed(data, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const body = await request.json().catch(() => null);
  const batch = batchSchema.safeParse(body);
  if (batch.success) {
    const before = await readAvailable(gate.session.supabase, batch.data.productId);
    const { data, error } = await gate.session.supabase.rpc("add_inventory_batch", {
      p_product_id: batch.data.productId,
      p_batch_date: batch.data.batchDate,
      p_reference: batch.data.reference,
      p_quantity: batch.data.quantity,
      p_note: batch.data.note,
    });
    const message = rpcFailed(data, error);
    if (message) return NextResponse.json({ error: message }, { status: 400 });
    await syncAvailability(gate.session.supabase, batch.data.productId, before);
    return NextResponse.json({ ok: true });
  }
  const adjust = adjustSchema.safeParse(body);
  if (!adjust.success) return NextResponse.json({ error: "Check the count fields." }, { status: 400 });
  const before = adjust.data.metric === "on_hand" || adjust.data.metric === "available"
    ? await readAvailable(gate.session.supabase, adjust.data.productId)
    : null;
  const { data, error } = await gate.session.supabase.rpc("adjust_inventory_count", {
    p_product_id: adjust.data.productId,
    p_metric: adjust.data.metric,
    p_next: adjust.data.next,
    p_reason: adjust.data.reason,
  });
  const message = rpcFailed(data, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  if (before !== null) await syncAvailability(gate.session.supabase, adjust.data.productId, before);
  return NextResponse.json({ ok: true });
}
