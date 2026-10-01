import { NextRequest, NextResponse } from "next/server";
import { publicUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";
import { roleForAccount } from "@/lib/portal/super-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ user: null });
    const profile = await supabase.from("profiles").select("name, email, role, active").eq("id", data.user.id).maybeSingle();
    const email = profile.data?.email ?? data.user.email ?? "";
    const role = await roleForAccount(email, profile.data?.role ?? "customer");
    if (profile.data?.active === false && role !== "super_admin") {
      await supabase.auth.signOut();
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: data.user.id,
        name: profile.data?.name ?? String(data.user.user_metadata?.name ?? "Customer"),
        email,
        role,
      },
    });
  }

  const user = await userFromToken(sessionToken(request));
  return NextResponse.json({ user: user ? publicUser(user) : null });
}
