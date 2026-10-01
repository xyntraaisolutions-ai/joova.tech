import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isServiceRoleConfigured, createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/mail/send";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const bodySchema = z.object({
  email: z.email(),
});

const sent = {
  ok: true,
  message: "If an account exists for that email, we sent a reset link. It can take a minute to arrive.",
};

function originOf(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the email on your account." }, { status: 400 });
  }

  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Password reset email is available when the account service is connected." },
      { status: 503 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const origin = originOf(request);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${origin}/account/reset` },
  });
  if (error && error.message.toLowerCase().includes("not found")) return NextResponse.json(sent);
  if (error || !data?.user || !data.properties?.hashed_token) {
    console.error("generateLink recovery", error?.message ?? "missing token");
    return NextResponse.json({ error: "We could not send the reset email. Try again." }, { status: 400 });
  }

  const profile = await admin.from("profiles").select("name").eq("id", data.user.id).maybeSingle();
  const resetLink = `${origin}/account/reset?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`;
  const mailed = await sendPasswordResetEmail({
    origin,
    to: email,
    name: profile.data?.name ?? String(data.user.user_metadata?.name ?? ""),
    resetLink,
  });
  if (!mailed.ok) {
    return NextResponse.json({ error: mailed.error }, { status: 400 });
  }
  return NextResponse.json(sent);
}
