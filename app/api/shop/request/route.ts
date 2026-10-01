import { NextResponse } from "next/server";
import { z } from "zod";
import { sendStockRequestEmail } from "@/lib/mail/request";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  note: z.string().trim().max(2000).default(""),
  productId: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your name and email." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Requests are not available right now." }, { status: 503 });

  const supabase = await createClient();
  const product = await supabase
    .from("products")
    .select("id, name, sku, published, deleted_at")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  const productRow = product.data;
  if (product.error || !productRow || productRow.deleted_at || !productRow.published) {
    return NextResponse.json({ error: "That item could not be requested." }, { status: 400 });
  }
  const stock = await supabase.rpc("public_stock");
  const row = Array.isArray(stock.data)
    ? (stock.data as { product_id?: string; availability?: string }[]).find((item) => item.product_id === productRow.id)
    : undefined;
  if (row?.availability !== "out_of_stock") {
    return NextResponse.json({ error: "That item is available to order." }, { status: 400 });
  }

  const note = parsed.data.note || "Please let me know when this item is available.";
  const sku = productRow.sku ?? "";
  const message = [
    `Customer request for ${productRow.name}${sku ? ` (${sku})` : ""}.`,
    "",
    note,
  ].join("\n");
  const saved = await supabase.rpc("submit_stock_request", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_message: message,
    p_product: productRow.id,
  });
  const result = saved.data as { ok?: boolean } | null;
  if (saved.error || result?.ok !== true) {
    return NextResponse.json({ error: "The request could not be sent." }, { status: 400 });
  }
  await sendStockRequestEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    productName: productRow.name,
    sku,
    note,
  });
  return NextResponse.json({ saved: true });
}
