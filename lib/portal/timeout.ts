import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { VIEW_AS_COOKIE } from "@/lib/portal/roles";

export const PORTAL_SEEN = "joova-portal-seen";
export const PORTAL_STARTED = "joova-portal-started";
export const IDLE_SECONDS = 15 * 60;
export const ABSOLUTE_SECONDS = 8 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function stampPortalSession(response: NextResponse, started?: number) {
  const now = Math.floor(Date.now() / 1000);
  response.cookies.set(PORTAL_SEEN, String(now), cookieOptions(ABSOLUTE_SECONDS));
  response.cookies.set(PORTAL_STARTED, String(started ?? now), cookieOptions(ABSOLUTE_SECONDS));
}

export function clearPortalSession(response: NextResponse) {
  response.cookies.set(PORTAL_SEEN, "", cookieOptions(0));
  response.cookies.set(PORTAL_STARTED, "", cookieOptions(0));
  response.cookies.set(VIEW_AS_COOKIE, "", cookieOptions(0));
}

export async function portalClock() {
  const jar = await cookies();
  const seen = Number(jar.get(PORTAL_SEEN)?.value ?? "");
  const started = Number(jar.get(PORTAL_STARTED)?.value ?? "");
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(seen) || !Number.isFinite(started) || seen <= 0 || started <= 0) {
    return { state: "missing" as const, idleLeft: IDLE_SECONDS, absoluteLeft: ABSOLUTE_SECONDS, started: now };
  }
  const idleLeft = IDLE_SECONDS - (now - seen);
  const absoluteLeft = ABSOLUTE_SECONDS - (now - started);
  if (idleLeft <= 0 || absoluteLeft <= 0) {
    return { state: "expired" as const, idleLeft, absoluteLeft, started };
  }
  return { state: "ok" as const, idleLeft, absoluteLeft, started };
}
