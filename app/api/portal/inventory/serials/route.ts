import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";

const fields = {
  serial: z.string().trim().min(1, "Enter the serial number.").max(80).refine((value) => !/[%_\\]/.test(value), "Enter the serial number without % or _."),
  manufacturerSku: z.string().trim().max(80).default(""),
  manufacturerModel: z.string().trim().max(80).default(""),
  manufacturerWarranty: z.string().trim().max(160).default(""),
  productName: z.string().trim().max(160).default(""),
  color: z.string().trim().max(80).default(""),
  productType: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(2000).default(""),
};

const saveSchema = z.object({
  action: z.literal("save").optional(),
  id: z.uuid().optional(),
  ...fields,
});

const removeSchema = z.object({
  action: z.literal("remove"),
  id: z.uuid(),
});

const select =
  "id, serial, manufacturer_sku, manufacturer_model, manufacturer_warranty, product_name, color, product_type, notes, created_at, updated_at";

function row(record: {
  id: string;
  serial: string;
  manufacturer_sku: string;
  manufacturer_model: string;
  manufacturer_warranty: string;
  product_name: string;
  color: string;
  product_type: string;
  notes: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: record.id,
    serial: record.serial,
    manufacturerSku: record.manufacturer_sku,
    manufacturerModel: record.manufacturer_model,
    manufacturerWarranty: record.manufacturer_warranty,
    productName: record.product_name,
    color: record.color,
    productType: record.product_type,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const safe = q.replace(/[%_,().*\\]/g, "");
  let listed = session.supabase.from("inventory_serials").select(select).is("deleted_at", null);
  if (safe) {
    listed = listed.or(
      `serial.ilike.%${safe}%,manufacturer_sku.ilike.%${safe}%,manufacturer_model.ilike.%${safe}%,product_name.ilike.%${safe}%,color.ilike.%${safe}%,product_type.ilike.%${safe}%`,
    );
  }
  const [rows, counted] = await Promise.all([
    listed.order("created_at", { ascending: false }).limit(200),
    session.supabase.from("inventory_serials").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);
  if (rows.error) return NextResponse.json({ error: "Serial numbers could not be loaded." }, { status: 400 });
  return NextResponse.json({
    serials: (rows.data ?? []).map((item) => row(item)),
    count: counted.count ?? 0,
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const body = await request.json().catch(() => null);
  const remove = removeSchema.safeParse(body);
  if (remove.success) {
    const result = await session.supabase
      .from("inventory_serials")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", remove.data.id)
      .is("deleted_at", null);
    if (result.error) return NextResponse.json({ error: "That serial number could not be removed." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the serial number and try again." }, { status: 400 });
  }
  const input = parsed.data;
  const duplicate = session.supabase
    .from("inventory_serials")
    .select("id")
    .is("deleted_at", null)
    .ilike("serial", input.serial);
  const taken = await (input.id ? duplicate.neq("id", input.id) : duplicate).maybeSingle();
  if (taken.error) return NextResponse.json({ error: "That serial number could not be checked." }, { status: 400 });
  if (taken.data) return NextResponse.json({ error: "That serial number is already entered." }, { status: 400 });

  const values = {
    serial: input.serial,
    manufacturer_sku: input.manufacturerSku,
    manufacturer_model: input.manufacturerModel,
    manufacturer_warranty: input.manufacturerWarranty,
    product_name: input.productName,
    color: input.color,
    product_type: input.productType,
    notes: input.notes,
    updated_at: new Date().toISOString(),
  };
  const saved = input.id
    ? await session.supabase.from("inventory_serials").update(values).eq("id", input.id).is("deleted_at", null).select(select).maybeSingle()
    : await session.supabase.from("inventory_serials").insert(values).select(select).single();
  if (saved.error || !saved.data) {
    const message = saved.error?.code === "23505" ? "That serial number is already entered." : "That serial number could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ serial: row(saved.data) });
}
