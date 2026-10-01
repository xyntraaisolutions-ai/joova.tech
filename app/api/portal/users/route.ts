import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";
import { ROLES } from "@/lib/portal/roles";
import { superAdminEmail } from "@/lib/portal/super-admin";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const createSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(100),
  role: z.enum(ROLES),
});

const updateSchema = z.object({
  action: z.literal("update"),
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  role: z.enum(ROLES),
  active: z.boolean(),
  email: z.email(),
});

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const { data: users, error } = await session.supabase
    .from("profiles")
    .select("id, name, email, role, active, created_at, deleted_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Users could not be loaded." }, { status: 400 });
  const lockedEmail = await superAdminEmail();
  return NextResponse.json({
    users: (users ?? []).map((user) => ({ ...user, locked: lockedEmail !== "" && user.email.toLowerCase() === lockedEmail })),
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const body = await request.json().catch(() => null);
  const created = createSchema.safeParse(body);
  if (created.success) {
    if (created.data.role === "super_admin") {
      return NextResponse.json({ error: "Super Admin is assigned from the backend." }, { status: 400 });
    }
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
    }
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: created.data.email,
      password: created.data.password,
      email_confirm: true,
      user_metadata: { name: created.data.name },
    });
    if (error || !data.user) {
      const exists = (error?.message ?? "").toLowerCase().includes("already");
      return NextResponse.json(
        { error: exists ? "An account with that email already exists." : "The account could not be created." },
        { status: exists ? 409 : 400 },
      );
    }
    const { error: roleError } = await admin.from("profiles").update({
      name: created.data.name,
      role: created.data.role,
      active: true,
    }).eq("id", data.user.id);
    if (roleError) return NextResponse.json({ error: "The account was created, but the role was not saved." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "create_user",
      p_entity: "profiles",
      p_entity_id: data.user.id,
      p_detail: { role: created.data.role, email: created.data.email },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const updated = updateSchema.safeParse(body);
  if (!updated.success) return NextResponse.json({ error: "Check the user details." }, { status: 400 });
  if (updated.data.role === "super_admin") {
    return NextResponse.json({ error: "Super Admin is assigned from the backend." }, { status: 400 });
  }
  const lockedEmail = await superAdminEmail();
  const currentAccount = await session.supabase.from("profiles").select("email").eq("id", updated.data.id).maybeSingle();
  if (lockedEmail && currentAccount.data?.email.toLowerCase() === lockedEmail) {
    return NextResponse.json({ error: "The Super Admin can only be changed from the backend." }, { status: 400 });
  }
  const { data, error } = await session.supabase.rpc("set_user_role", {
    p_id: updated.data.id,
    p_role: updated.data.role,
    p_active: updated.data.active,
    p_view_as: viewAs,
  });
  const message = rpcFailed(data as { ok?: boolean; error?: string } | null, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
  }
  const admin = createAdminClient();
  const nameUpdate = await admin.from("profiles").update({ name: updated.data.name }).eq("id", updated.data.id);
  if (nameUpdate.error) return NextResponse.json({ error: "The name could not be saved." }, { status: 400 });
  await admin.auth.admin.updateUserById(updated.data.id, { user_metadata: { name: updated.data.name } });
  const current = await session.supabase.from("profiles").select("email").eq("id", updated.data.id).maybeSingle();
  if (current.data && current.data.email !== updated.data.email.toLowerCase()) {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
    }
    const admin = createAdminClient();
    const emailUpdate = await admin.auth.admin.updateUserById(updated.data.id, { email: updated.data.email, email_confirm: true });
    if (emailUpdate.error) return NextResponse.json({ error: "The email could not be changed." }, { status: 400 });
    const profileEmail = await admin.from("profiles").update({ email: updated.data.email.toLowerCase() }).eq("id", updated.data.id);
    if (profileEmail.error) return NextResponse.json({ error: "The email could not be changed." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "change_email",
      p_entity: "profiles",
      p_entity_id: updated.data.id,
      p_detail: { email: updated.data.email.toLowerCase() },
      p_view_as: viewAs,
    });
  }
  return NextResponse.json({ ok: true });
}
