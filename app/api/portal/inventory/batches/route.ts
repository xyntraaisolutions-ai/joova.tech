import { NextResponse } from "next/server";
import { z } from "zod";
import { batchTotals } from "@/lib/portal/batch-cost";
import { requirePortalApi } from "@/lib/portal/api";

const statuses = ["draft", "review", "ordered", "shipped", "delivered", "delayed", "abandoned", "completed"] as const;

const itemSchema = z.object({
  id: z.uuid().optional(),
  productId: z.string().trim().max(40).default(""),
  productName: z.string().trim().max(160).default(""),
  joovaModel: z.string().trim().max(80).default(""),
  manufacturerModel: z.string().trim().max(80).default(""),
  quantity: z.number().int().min(1).max(1_000_000),
  unitPrice: z.number().min(0).max(1_000_000),
  unitDiscount: z.number().min(0).max(1_000_000),
  notes: z.string().trim().max(2000).default(""),
});

const saveSchema = z.object({
  action: z.literal("save").optional(),
  id: z.uuid().optional(),
  vendor: z.string().trim().min(1).max(160),
  status: z.enum(statuses),
  notes: z.string().trim().max(4000).default(""),
  shippingCost: z.number().min(0).max(1_000_000),
  miscCost: z.number().min(0).max(1_000_000),
  items: z.array(itemSchema).max(100),
});

const removeSchema = z.object({
  action: z.literal("remove"),
  id: z.uuid(),
});

const batchSelect =
  "id, vendor, status, notes, shipping_cost, misc_cost, created_at, updated_at, inventory_batch_request_items(id, product_id, product_name, joova_model, manufacturer_model, quantity, unit_price, unit_discount, notes, sort), inventory_batch_request_files(id, name, content_type, created_at, deleted_at)";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

type ItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  joova_model: string;
  manufacturer_model: string;
  quantity: number;
  unit_price: number | string;
  unit_discount: number | string;
  notes: string;
  sort: number;
};

type FileRow = {
  id: string;
  name: string;
  content_type: string;
  created_at: string;
  deleted_at: string | null;
};

type BatchRow = {
  id: string;
  vendor: string;
  status: string;
  notes: string;
  shipping_cost: number | string;
  misc_cost: number | string;
  created_at: string;
  updated_at: string;
  inventory_batch_request_items: ItemRow[] | null;
  inventory_batch_request_files: FileRow[] | null;
};

function present(row: BatchRow) {
  const items = [...(row.inventory_batch_request_items ?? [])].sort((left, right) => left.sort - right.sort);
  const lines = items.map((item) => ({
    id: item.id,
    productId: item.product_id ?? "",
    productName: item.product_name,
    joovaModel: item.joova_model,
    manufacturerModel: item.manufacturer_model,
    quantity: item.quantity,
    unitPrice: asNumber(item.unit_price),
    unitDiscount: asNumber(item.unit_discount),
    notes: item.notes,
  }));
  const totals = batchTotals(lines, asNumber(row.shipping_cost), asNumber(row.misc_cost));
  return {
    id: row.id,
    vendor: row.vendor,
    status: row.status,
    notes: row.notes,
    shippingCost: totals.shipping,
    miscCost: totals.misc,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: lines,
    files: (row.inventory_batch_request_files ?? [])
      .filter((file) => !file.deleted_at)
      .map((file) => ({ id: file.id, name: file.name, contentType: file.content_type, createdAt: file.created_at })),
    quantity: totals.quantity,
    itemsCost: totals.items,
    total: totals.total,
  };
}

export async function GET() {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const [batches, products] = await Promise.all([
    session.supabase.from("inventory_batch_requests").select(batchSelect).is("deleted_at", null).order("updated_at", { ascending: false }),
    session.supabase.from("products").select("id, name, sku, commerce").is("deleted_at", null).order("name"),
  ]);
  if (batches.error) return NextResponse.json({ error: "Batch requests could not be loaded." }, { status: 400 });
  if (products.error) return NextResponse.json({ error: "Products could not be loaded." }, { status: 400 });
  const rows = ((batches.data ?? []) as BatchRow[]).map(present);
  return NextResponse.json({
    batches: rows,
    count: rows.length,
    products: (products.data ?? []).map((product) => {
      const commerce = (product.commerce ?? {}) as Record<string, unknown>;
      return {
        id: product.id,
        name: product.name,
        sku: product.sku ?? "",
        model: typeof commerce.model === "string" ? commerce.model : "",
        manufacturerModel: typeof commerce.manufacturerModel === "string" ? commerce.manufacturerModel : "",
      };
    }),
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const json = await request.json().catch(() => null);
  const removing = removeSchema.safeParse(json);
  if (removing.success) {
    const removed = await session.supabase
      .from("inventory_batch_requests")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", removing.data.id)
      .is("deleted_at", null);
    if (removed.error) return NextResponse.json({ error: "That batch could not be removed." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "remove_batch_request",
      p_entity: "inventory_batch_requests",
      p_entity_id: removing.data.id,
      p_detail: {},
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Check the batch request." }, { status: 400 });
  const body = parsed.data;
  if (body.status !== "draft" && body.items.length === 0) {
    return NextResponse.json({ error: "Add at least one item before this batch leaves draft." }, { status: 400 });
  }
  for (const item of body.items) {
    if (money(item.unitDiscount) > money(item.unitPrice)) {
      return NextResponse.json({ error: "A unit discount cannot be higher than the unit price." }, { status: 400 });
    }
    if (!item.productId && !item.productName.trim()) {
      return NextResponse.json({ error: "Name each new product on the batch." }, { status: 400 });
    }
  }
  const productIds = [...new Set(body.items.map((item) => item.productId).filter(Boolean))];
  if (productIds.length) {
    const found = await session.supabase.from("products").select("id, name, commerce").in("id", productIds).is("deleted_at", null);
    if (found.error) return NextResponse.json({ error: "Those products could not be checked." }, { status: 400 });
    const known = new Map((found.data ?? []).map((product) => [product.id, product]));
    if (productIds.some((id) => !known.has(id))) {
      return NextResponse.json({ error: "Choose a product from the list, or enter a new product." }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const header = {
    vendor: body.vendor,
    status: body.status,
    notes: body.notes,
    shipping_cost: money(body.shippingCost),
    misc_cost: money(body.miscCost),
    updated_at: now,
  };
  let batchId = body.id ?? "";
  if (batchId) {
    const updated = await session.supabase.from("inventory_batch_requests").update(header).eq("id", batchId).is("deleted_at", null).select("id").maybeSingle();
    if (updated.error || !updated.data) return NextResponse.json({ error: "That batch could not be saved." }, { status: 400 });
  } else {
    const inserted = await session.supabase
      .from("inventory_batch_requests")
      .insert({ ...header, created_by: session.profile.id })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) return NextResponse.json({ error: "That batch could not be saved." }, { status: 400 });
    batchId = inserted.data.id;
  }

  const cleared = await session.supabase.from("inventory_batch_request_items").delete().eq("batch_id", batchId);
  if (cleared.error) return NextResponse.json({ error: "The batch items could not be saved." }, { status: 400 });
  if (body.items.length) {
    const inserted = await session.supabase.from("inventory_batch_request_items").insert(body.items.map((item, index) => ({
      batch_id: batchId,
      product_id: item.productId || null,
      product_name: item.productName,
      joova_model: item.joovaModel,
      manufacturer_model: item.manufacturerModel,
      quantity: item.quantity,
      unit_price: money(item.unitPrice),
      unit_discount: money(item.unitDiscount),
      notes: item.notes,
      sort: index,
    })));
    if (inserted.error) return NextResponse.json({ error: "The batch items could not be saved." }, { status: 400 });
  }

  await session.supabase.rpc("record_audit", {
    p_action: "save_batch_request",
    p_entity: "inventory_batch_requests",
    p_entity_id: batchId,
    p_detail: { status: body.status, items: body.items.length },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, id: batchId });
}
