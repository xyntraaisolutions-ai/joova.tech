import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const bodySchema = z.object({
  table: z.string().trim().min(1).max(40),
  id: z.string().trim().min(1).max(200),
  confirm: z.string().trim().min(1).max(40),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const gate = await requirePortalApi(["support", "inventory", "content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the confirmation." }, { status: 400 });
  const { data, error } = await session.supabase.rpc("manage_resource_delete", {
    p_table: parsed.data.table,
    p_id: parsed.data.id,
    p_confirm: parsed.data.confirm,
    p_reason: parsed.data.reason ?? "",
    p_view_as: viewAs,
  });
  const message = rpcFailed(data as { ok?: boolean; error?: string } | null, error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  const result = data as { auth_delete?: boolean };
  if (result.auth_delete) {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: "The server-only service role key is missing." }, { status: 500 });
    }
    const removed = await createAdminClient().auth.admin.deleteUser(parsed.data.id);
    if (removed.error) return NextResponse.json({ error: "The account could not be deleted." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
