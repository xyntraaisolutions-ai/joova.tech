import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/mock-store";
import { clearSessionCookie, sessionToken } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  await deleteSession(sessionToken(request));
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
