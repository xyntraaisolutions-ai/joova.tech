import { NextResponse } from "next/server";
import { z } from "zod";
import { countryByCode } from "@/lib/geo/countries";
import { requirePortalApi } from "@/lib/portal/api";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), code: z.string().trim().length(2) }),
  z.object({
    action: z.literal("remove"),
    code: z.string().trim().length(2),
    reason: z.string().trim().min(3).max(500),
  }),
]);

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { data, error } = await gate.session.supabase
    .from("sell_countries")
    .select("code, name, currency, enabled, locked")
    .eq("enabled", true)
    .order("name");
  if (error) return NextResponse.json({ error: "Countries could not be loaded." }, { status: 400 });
  return NextResponse.json({ countries: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the country form." }, { status: 400 });
  const { session, viewAs } = gate;
  const code = parsed.data.code.toUpperCase();
  const known = countryByCode(code);
  if (!known) return NextResponse.json({ error: "Choose a country from the list." }, { status: 400 });

  if (parsed.data.action === "add") {
    const saved = await session.supabase.from("sell_countries").upsert({
      code: known.code,
      name: known.name,
      currency: known.currency,
      enabled: true,
      locked: known.code === "US",
    });
    if (saved.error) return NextResponse.json({ error: "That country could not be added." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "add_sell_country",
      p_entity: "sell_countries",
      p_entity_id: known.code,
      p_detail: { name: known.name, currency: known.currency },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }

  if (known.code === "US") return NextResponse.json({ error: "United States stays available." }, { status: 400 });
  const current = await session.supabase.from("sell_countries").select("locked").eq("code", known.code).maybeSingle();
  if (current.data?.locked) return NextResponse.json({ error: "United States stays available." }, { status: 400 });
  const saved = await session.supabase.from("sell_countries").update({ enabled: false }).eq("code", known.code);
  if (saved.error) return NextResponse.json({ error: "That country could not be removed." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: "remove_sell_country",
    p_entity: "sell_countries",
    p_entity_id: known.code,
    p_detail: { reason: parsed.data.reason, name: known.name },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
