import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ found: false }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_status", { p_session: sessionId });
  if (error) return NextResponse.json({ error: "That payment could not be confirmed." }, { status: 400 });
  return NextResponse.json(data ?? { found: false });
}
