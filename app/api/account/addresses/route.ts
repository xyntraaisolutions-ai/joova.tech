import { NextResponse } from "next/server";
import { z } from "zod";
import { US_STATES } from "@/components/shop/us-states";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const states = new Set<string>(US_STATES.map(([code]) => code));

const bodySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(80),
  line1: z.string().trim().min(1).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  region: z.string().trim().length(2),
  postal: z.string().trim().regex(/^[0-9]{5}(-[0-9]{4})?$/),
  isDefault: z.boolean().optional(),
});

async function userClient() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, userId: data.user.id };
}

export async function GET() {
  const session = await userClient();
  if (!session) return NextResponse.json({ addresses: [] });
  const addresses = await session.supabase
    .from("customer_addresses")
    .select("id, name, line1, line2, city, region, postal, is_default")
    .eq("user_id", session.userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (addresses.error) return NextResponse.json({ error: "Saved addresses could not be loaded." }, { status: 400 });
  return NextResponse.json({ addresses: addresses.data ?? [] });
}

export async function POST(request: Request) {
  const session = await userClient();
  if (!session) return NextResponse.json({ error: "Sign in to save an address." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !states.has(parsed.data.region.toUpperCase())) {
    return NextResponse.json({ error: "Check the address." }, { status: 400 });
  }
  if (parsed.data.isDefault) {
    await session.supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", session.userId);
  }
  const row = {
    user_id: session.userId,
    name: parsed.data.name,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? "",
    city: parsed.data.city,
    region: parsed.data.region.toUpperCase(),
    postal: parsed.data.postal.slice(0, 5),
    is_default: parsed.data.isDefault ?? false,
  };
  const saved = parsed.data.id
    ? await session.supabase.from("customer_addresses").update(row).eq("id", parsed.data.id).eq("user_id", session.userId)
    : await session.supabase.from("customer_addresses").insert(row);
  if (saved.error) return NextResponse.json({ error: "The address could not be saved." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await userClient();
  if (!session) return NextResponse.json({ error: "Sign in to remove an address." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return NextResponse.json({ error: "Choose an address." }, { status: 400 });
  const removed = await session.supabase.from("customer_addresses").delete().eq("id", parsed.data).eq("user_id", session.userId);
  if (removed.error) return NextResponse.json({ error: "The address could not be removed." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
