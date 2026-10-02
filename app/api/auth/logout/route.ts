import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/mock-store";
import { clearSessionCookie, sessionToken } from "@/lib/session-cookie";
import { clearPortalSession } from "@/lib/portal/timeout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    const response = NextResponse.json({ ok: true });
    clearPortalSession(response);
    return response;
  }

  await deleteSession(sessionToken(request));
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
