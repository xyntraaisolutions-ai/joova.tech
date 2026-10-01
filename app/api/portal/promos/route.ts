import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";

const promoSelect = "code, kind, amount, starts_on, ends_on, max_uses, used_count, enabled";

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const promos = await gate.session.supabase.from("promo_codes").select(promoSelect).order("code");
  if (promos.error) return NextResponse.json({ error: "Promo codes could not be loaded." }, { status: 400 });
  return NextResponse.json({ promos: promos.data ?? [] });
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    code: z.string().trim().min(2).max(40),
    kind: z.enum(["percent", "amount"]),
    amount: z.number().positive().max(100000),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    maxUses: z.number().int().positive().max(1000000).nullable(),
    enabled: z.boolean(),
  }),
  z.object({
    action: z.literal("delete"),
    code: z.string().trim().min(2).max(40),
  }),
]);

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the promo code." }, { status: 400 });
  const { supabase } = gate.session;
  if (parsed.data.action === "delete") {
    const removed = await supabase.from("promo_codes").delete().eq("code", parsed.data.code.trim().toUpperCase());
    if (removed.error) return NextResponse.json({ error: "That promo code could not be removed." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const code = parsed.data.code.trim().toUpperCase();
  if (parsed.data.kind === "percent" && parsed.data.amount > 100) {
    return NextResponse.json({ error: "A percent discount cannot be more than 100." }, { status: 400 });
  }
  if (parsed.data.startsOn && parsed.data.endsOn && parsed.data.endsOn < parsed.data.startsOn) {
    return NextResponse.json({ error: "The end date has to be on or after the start date." }, { status: 400 });
  }
  const saved = await supabase.from("promo_codes").upsert({
    code,
    kind: parsed.data.kind,
    amount: parsed.data.amount,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
    max_uses: parsed.data.maxUses,
    enabled: parsed.data.enabled,
  });
  if (saved.error) return NextResponse.json({ error: "The promo code could not be saved." }, { status: 400 });
  await supabase.rpc("record_audit", {
    p_action: "save_promo",
    p_entity: "promo_codes",
    p_entity_id: code,
    p_detail: { kind: parsed.data.kind, amount: parsed.data.amount, enabled: parsed.data.enabled },
    p_view_as: gate.viewAs,
  });
  return NextResponse.json({ ok: true });
}
