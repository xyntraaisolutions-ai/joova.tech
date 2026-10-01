import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const serialPattern = /^(JSB01|JSB02|JSR01|STRAP1|STRAP2)-[0-9]{4}-[0-9]{6}$/;

function deviceStatus(coverageEnds: string | null, purchaseDate: string | null, model: string | null) {
  const end = coverageEnds?.slice(0, 10) ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const active = end === "" || end >= today;
  const strap = (model ?? "").startsWith("STRAP");
  const purchase = purchaseDate?.slice(0, 10) ?? "";
  const extended = !strap && purchase && end && end > purchase.replace(/(\d{4})/, (year) => String(Number(year) + 1));
  const label = !active ? "Ended" : strap ? "90-day coverage" : extended ? "Extended to 2 years" : "1-year coverage";
  return { status: label, coverageEnds: end };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ devices: [] });
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ devices: [] }, { status: 401 });
  const { data, error } = await supabase
    .from("warranty_registrations")
    .select("id, serial, model_code, product_id, purchase_date, purchased_from, coverage_ends_at, registered_at")
    .is("deleted_at", null)
    .order("registered_at", { ascending: false });
  if (error) return NextResponse.json({ devices: [] }, { status: 500 });
  const devices = (data ?? []).map((row) => ({
    id: row.id,
    serial: row.serial ?? "",
    model: row.model_code ?? row.product_id,
    purchasedFrom: row.purchased_from ?? "",
    purchaseDate: row.purchase_date,
    ...deviceStatus(row.coverage_ends_at, row.purchase_date, row.model_code),
  }));
  return NextResponse.json({ devices });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Sign in to register a device." }, { status: 503 });
  }
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "Sign in to register a device." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const parsed = z.object({
    serial: z.string().regex(serialPattern, "Enter a serial number like JSB01-2611-000123."),
    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the purchase date."),
    purchasedFrom: z.string().trim().min(2).max(80),
    email: z.email(),
  }).safeParse({
    serial: String(form?.get("serial") ?? "").trim().toUpperCase(),
    purchaseDate: form?.get("purchaseDate"),
    purchasedFrom: form?.get("purchasedFrom"),
    email: form?.get("email"),
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  }

  const receipt = form?.get("receipt");
  if (!(receipt instanceof File) || receipt.size < 1 || receipt.size > 8_000_000) {
    return NextResponse.json({ ok: false, error: "Add a receipt image or PDF under 8 MB." }, { status: 400 });
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(receipt.type)) {
    return NextResponse.json({ ok: false, error: "Use a JPG, PNG, WEBP, or PDF receipt." }, { status: 400 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ ok: false, error: "The receipt could not be saved." }, { status: 503 });
  }

  const extension = receipt.type === "application/pdf" ? "pdf" : receipt.type.split("/")[1] ?? "bin";
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const uploaded = await admin.storage.from("receipts").upload(path, Buffer.from(await receipt.arrayBuffer()), {
    contentType: receipt.type,
    upsert: false,
  });
  if (uploaded.error) {
    return NextResponse.json({ ok: false, error: "The receipt could not be saved." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("register_device_warranty", {
    p_serial: parsed.data.serial,
    p_purchase: parsed.data.purchaseDate,
    p_from: parsed.data.purchasedFrom,
    p_email: parsed.data.email,
    p_receipt: path,
  });
  if (error || !data || data.ok !== true) {
    await admin.storage.from("receipts").remove([path]);
    return NextResponse.json({ ok: false, error: data?.error ?? "The device could not be registered." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, extended: data.extended === true, coverageEnds: data.coverageEnds });
}
