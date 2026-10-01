import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteSalesTax } from "@/lib/tax/quote";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  region: z.string().trim().length(2),
  postal: z.string().trim().min(5).max(10),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(40),
    quantity: z.number().int().positive().max(20),
  })).min(1).max(50),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a state and ZIP code to calculate sales tax." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Sales tax could not be calculated." }, { status: 503 });
  const supabase = await createClient();
  const quoted = await quoteSalesTax(supabase, parsed.data);
  if (!quoted.ok) return NextResponse.json({ error: quoted.error, state: quoted.state }, { status: 400 });
  return NextResponse.json(quoted.quote);
}
