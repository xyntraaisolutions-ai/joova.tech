import { NextResponse } from "next/server";
import { z } from "zod";
import { MARKET_COOKIE } from "@/lib/geo/market";
import { countryByCode } from "@/lib/geo/countries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const bodySchema = z.object({ code: z.string().trim().length(2) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a country." }, { status: 400 });
  const known = countryByCode(parsed.data.code);
  if (!known) return NextResponse.json({ error: "Choose a country." }, { status: 400 });
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const found = await supabase.from("sell_countries").select("code").eq("code", known.code).eq("enabled", true).maybeSingle();
    if (found.error || !found.data) return NextResponse.json({ error: "That country is not available." }, { status: 400 });
  } else if (known.code !== "US") {
    return NextResponse.json({ error: "That country is not available." }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MARKET_COOKIE, known.code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
