import { NextResponse } from "next/server";
import { z } from "zod";
import { availableUnits } from "@/lib/portal/availability";
import { requirePortalApi } from "@/lib/portal/api";

const saveSchema = z.object({
  productId: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/),
  enabled: z.boolean(),
  threshold: z.number().int().min(0).max(1_000_000),
  notify: z.boolean(),
  emails: z.array(z.string().trim().email().max(160)).max(20),
});

export async function GET(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const productId = new URL(request.url).searchParams.get("product")?.trim() ?? "";
  const { session } = gate;
  if (productId) {
    const [rule, product] = await Promise.all([
      session.supabase.from("inventory_low_stock").select("enabled, threshold, notify, watcher_emails").eq("product_id", productId).maybeSingle(),
      session.supabase.from("products").select("id").eq("id", productId).is("deleted_at", null).maybeSingle(),
    ]);
    if (product.error || !product.data) return NextResponse.json({ error: "That product could not be loaded." }, { status: 400 });
    if (rule.error) return NextResponse.json({ error: "The low stock rule could not be loaded." }, { status: 400 });
    return NextResponse.json({
      rule: {
        enabled: rule.data?.enabled ?? false,
        threshold: rule.data?.threshold ?? 5,
        notify: rule.data?.notify ?? true,
        emails: rule.data?.watcher_emails ?? [],
      },
    });
  }

  const rules = await session.supabase.from("inventory_low_stock").select("product_id, threshold, notify, watcher_emails").eq("enabled", true);
  if (rules.error) return NextResponse.json({ error: "Low stock could not be loaded." }, { status: 400 });
  const ids = (rules.data ?? []).map((row) => row.product_id);
  if (!ids.length) return NextResponse.json({ rows: [], count: 0 });
  const [products, stock] = await Promise.all([
    session.supabase.from("products").select("id, name, sku").in("id", ids).is("deleted_at", null),
    session.supabase.from("inventory").select("product_id, on_hand, reserved").in("product_id", ids).is("variant_id", null).eq("warehouse", "US").is("deleted_at", null),
  ]);
  if (products.error || stock.error) return NextResponse.json({ error: "Low stock could not be loaded." }, { status: 400 });
  const names = new Map((products.data ?? []).map((product) => [product.id, product]));
  const units = new Map((stock.data ?? []).map((row) => [row.product_id, availableUnits(row.on_hand, row.reserved)]));
  const rows = (rules.data ?? [])
    .filter((rule) => names.has(rule.product_id))
    .map((rule) => {
      const product = names.get(rule.product_id);
      const available = units.get(rule.product_id) ?? 0;
      return {
        productId: rule.product_id,
        name: product?.name ?? rule.product_id,
        sku: product?.sku ?? "",
        available,
        threshold: rule.threshold,
        notify: rule.notify,
        emails: rule.watcher_emails ?? [],
        low: available <= rule.threshold,
      };
    })
    .filter((row) => row.low)
    .sort((left, right) => left.available - right.available || left.name.localeCompare(right.name));
  return NextResponse.json({ rows, count: rows.length });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the low stock rule." }, { status: 400 });
  const body = parsed.data;
  const product = await gate.session.supabase.from("products").select("id").eq("id", body.productId).is("deleted_at", null).maybeSingle();
  if (product.error || !product.data) return NextResponse.json({ error: "Save the product before setting a low stock rule." }, { status: 400 });
  const emails = [...new Set(body.emails.map((email) => email.toLowerCase()))];
  const saved = await gate.session.supabase.from("inventory_low_stock").upsert({
    product_id: body.productId,
    enabled: body.enabled,
    threshold: body.threshold,
    notify: body.notify,
    watcher_emails: emails,
    updated_at: new Date().toISOString(),
  });
  if (saved.error) return NextResponse.json({ error: "The low stock rule could not be saved." }, { status: 400 });
  await gate.session.supabase.rpc("record_audit", {
    p_action: "save_low_stock",
    p_entity: "inventory_low_stock",
    p_entity_id: body.productId,
    p_detail: { enabled: body.enabled, threshold: body.threshold, notify: body.notify },
    p_view_as: gate.viewAs,
  });
  return NextResponse.json({ ok: true });
}
