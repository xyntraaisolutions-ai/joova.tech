import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { VIEW_AS_COOKIE, isViewAs } from "@/lib/portal/roles";

const bodySchema = z.object({
  role: z.string().nullable(),
});

export async function GET(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const next = new URL(request.url).searchParams.get("next") ?? "/portal/admin";
  const path = next.startsWith("/portal") ? next : "/portal/admin";
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set(VIEW_AS_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a portal to view." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  if (!parsed.data.role) {
    response.cookies.set(VIEW_AS_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  }
  if (!isViewAs(parsed.data.role)) {
    return NextResponse.json({ error: "Choose a portal to view." }, { status: 400 });
  }
  response.cookies.set(VIEW_AS_COOKIE, parsed.data.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
