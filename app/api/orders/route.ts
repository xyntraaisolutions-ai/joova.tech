import { NextRequest, NextResponse } from "next/server";
import { ordersForUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";

export async function GET(request: NextRequest) {
  const user = await userFromToken(sessionToken(request));
  if (!user) {
    return NextResponse.json({ orders: [] });
  }
  return NextResponse.json({ orders: await ordersForUser(user.id) });
}
