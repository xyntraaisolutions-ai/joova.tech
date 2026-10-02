import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, findUserByEmail, passwordMatches, publicUser } from "@/lib/mock-store";
import { setSessionCookie } from "@/lib/session-cookie";
import { isStaff, isRole, VIEW_AS_COOKIE } from "@/lib/portal/roles";
import { checkSuperAdminSignIn, roleForAccount, superAdminEmail } from "@/lib/portal/super-admin";
import { stampPortalSession } from "@/lib/portal/timeout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const email = parsed.data.email.toLowerCase();
    const checked = await checkSuperAdminSignIn(email, parsed.data.password);
    let superAdmin = false;
    if (!checked.unavailable) {
      superAdmin = checked.superAdmin;
    } else {
      const secretEmail = await superAdminEmail();
      superAdmin = secretEmail !== "" && email === secretEmail;
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
    if (error || !data.user) {
      console.error("signInWithPassword", error?.message ?? "no user");
      return NextResponse.json({ error: "Email or password does not match." }, { status: 401 });
    }
    const profile = await supabase.from("profiles").select("name, email, role, active").eq("id", data.user.id).maybeSingle();
    if (profile.data?.active === false && !superAdmin) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "This account is not active." }, { status: 403 });
    }
    const role = await roleForAccount(profile.data?.email ?? data.user.email ?? email, profile.data?.role ?? "customer");
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        name: profile.data?.name ?? String(data.user.user_metadata?.name ?? "Customer"),
        email: profile.data?.email ?? data.user.email ?? parsed.data.email,
        role,
      },
    });
    if (isRole(role) && isStaff(role)) stampPortalSession(response);
    if (role === "super_admin") {
      response.cookies.set(VIEW_AS_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    }
    return response;
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !passwordMatches(parsed.data.password, user)) {
    return NextResponse.json({ error: "Email or password does not match." }, { status: 401 });
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ user: publicUser(user) });
  setSessionCookie(response, token);
  return response;
}
