import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const gate = await requirePortalApi(["content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) return NextResponse.json({ devices: [] });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("warranty_registrations")
    .select("id, serial, model_code, contact_email, purchase_date, purchased_from, coverage_ends_at, receipt_path, deleted_at")
    .order("registered_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Devices could not be loaded." }, { status: 500 });
  return NextResponse.json({
    devices: (data ?? []).map((row) => ({
      id: row.id,
      serial: row.serial ?? "",
      model: row.model_code ?? "",
      email: row.contact_email ?? "",
      purchaseDate: row.purchase_date,
      purchasedFrom: row.purchased_from ?? "",
      coverageEnds: row.coverage_ends_at?.slice(0, 10) ?? "",
      hasReceipt: Boolean(row.receipt_path),
      removed: Boolean(row.deleted_at),
    })),
  });
}

const updateSchema = z.object({
  id: z.uuid(),
  coverageEnds: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  const gate = await requirePortalApi(["content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a coverage end date." }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Devices could not be updated." }, { status: 503 });
  const admin = createAdminClient();
  const { error } = await admin
    .from("warranty_registrations")
    .update({ coverage_ends_at: `${parsed.data.coverageEnds}T00:00:00Z` })
    .eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "The coverage date could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
