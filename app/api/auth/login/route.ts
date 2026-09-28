import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, findUserByEmail, passwordMatches, publicUser } from "@/lib/mock-store";
import { setSessionCookie } from "@/lib/session-cookie";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
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
