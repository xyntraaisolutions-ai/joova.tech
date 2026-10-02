import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, createUser, publicUser } from "@/lib/mock-store";
import { setSessionCookie } from "@/lib/session-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name } },
    });
    if (error) {
      const exists = error.message.toLowerCase().includes("already");
      return NextResponse.json(
        { error: exists ? "An account with that email already exists." : error.message },
        { status: exists ? 409 : 400 },
      );
    }
    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Check your email to confirm the account, then sign in." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      user: { id: data.user.id, name: parsed.data.name, email: parsed.data.email, role: "customer" },
    });
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
