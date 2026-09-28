import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, createUser, publicUser } from "@/lib/mock-store";
import { setSessionCookie } from "@/lib/session-cookie";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your name, a valid email, and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const created = await createUser(parsed.data);
  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 409 });
  }

  const token = await createSession(created.user.id);
  const response = NextResponse.json({ user: publicUser(created.user) });
  setSessionCookie(response, token);
  return response;
}
