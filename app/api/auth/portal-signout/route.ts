import { NextResponse } from "next/server";
import { clearPortalSession, portalClock } from "@/lib/portal/timeout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const clock = await portalClock();
  const destination = new URL("/account?mode=sign-in&next=/portal&timeout=1", request.url);
  if (clock.state !== "expired") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(destination);
  clearPortalSession(response);
  return response;
}
