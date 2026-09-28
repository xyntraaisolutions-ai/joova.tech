import { NextRequest, NextResponse } from "next/server";
import { publicUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";

export async function GET(request: NextRequest) {
  const user = await userFromToken(sessionToken(request));
  return NextResponse.json({ user: user ? publicUser(user) : null });
}
