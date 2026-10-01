import { NextResponse } from "next/server";
import { readPortalProfile, readViewAs } from "@/lib/portal/session";
import { canAccess, isStaff, type PortalArea } from "@/lib/portal/roles";
import { clearPortalSession, portalClock } from "@/lib/portal/timeout";

export async function requirePortalApi(areas: PortalArea[]) {
  const session = await readPortalProfile();
  if (!session || !isStaff(session.profile.role)) {
    return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  }
  const clock = await portalClock();
  if (clock.state === "expired") {
    await session.supabase.auth.signOut();
    const response = NextResponse.json({ error: "Your portal session timed out. Sign in again." }, { status: 401 });
    clearPortalSession(response);
    return { error: response };
  }
  const allowed = areas.some((area) => canAccess(session.profile.role, area));
  if (!allowed) {
    return { error: NextResponse.json({ error: "That area is not open for this role." }, { status: 403 }) };
  }
  const viewAs = (await readViewAs(session.profile.role)) ?? "";
  return { session, viewAs };
}

export function rpcFailed(data: { ok?: boolean; error?: string } | null, error: { message: string } | null) {
  if (error) return error.message;
  if (!data || data.ok === false) return data?.error ?? "That change could not be saved.";
  return null;
}
