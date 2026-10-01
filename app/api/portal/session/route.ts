import { NextResponse } from "next/server";
import { readPortalProfile } from "@/lib/portal/session";
import { isStaff } from "@/lib/portal/roles";
import { clearPortalSession, portalClock, stampPortalSession } from "@/lib/portal/timeout";

async function touch() {
  const session = await readPortalProfile();
  if (!session || !isStaff(session.profile.role)) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  const clock = await portalClock();
  if (clock.state === "expired") {
    await session.supabase.auth.signOut();
    const response = NextResponse.json({ error: "Your portal session timed out. Sign in again." }, { status: 401 });
    clearPortalSession(response);
    return response;
  }
  const response = NextResponse.json({
    idleLeft: clock.state === "missing" ? 15 * 60 : clock.idleLeft,
    absoluteLeft: clock.absoluteLeft,
  });
  stampPortalSession(response, clock.state === "missing" ? undefined : clock.started);
  return response;
}

export async function POST() {
  return touch();
}

export async function GET(request: Request) {
  const session = await readPortalProfile();
  if (!session || !isStaff(session.profile.role)) {
    return NextResponse.redirect(new URL("/account?mode=sign-in&next=/portal", request.url));
  }
  const clock = await portalClock();
  if (clock.state === "expired") {
    return NextResponse.redirect(new URL("/api/auth/portal-signout", request.url));
  }
  const next = new URL(request.url).searchParams.get("next") ?? "/portal";
  const safe = next.startsWith("/portal") ? next : "/portal";
  const response = NextResponse.redirect(new URL(safe, request.url));
  if (clock.state === "missing") stampPortalSession(response);
  return response;
}
