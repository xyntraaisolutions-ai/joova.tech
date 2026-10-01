import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const types = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const removeSchema = z.object({ id: z.uuid() });

function safeName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
  return cleaned.slice(0, 80) || "document";
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Batch documents are not ready yet." }, { status: 503 });
  }
  const form = await request.formData();
  const batchId = z.uuid().safeParse(String(form.get("batchId") ?? ""));
  const file = form.get("file");
  if (!batchId.success) return NextResponse.json({ error: "Save the batch before adding a document." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document." }, { status: 400 });
  if (!types.has(file.type)) return NextResponse.json({ error: "Use a PDF, JPEG, PNG, or WebP file." }, { status: 400 });
  if (file.size > 8_000_000) return NextResponse.json({ error: "Documents have to be under 8 MB." }, { status: 400 });

  const { session, viewAs } = gate;
  const batch = await session.supabase.from("inventory_batch_requests").select("id").eq("id", batchId.data).is("deleted_at", null).maybeSingle();
  if (batch.error || !batch.data) return NextResponse.json({ error: "That batch could not be loaded." }, { status: 400 });
  const existing = await session.supabase
    .from("inventory_batch_request_files")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId.data)
    .is("deleted_at", null);
  if ((existing.count ?? 0) >= 20) return NextResponse.json({ error: "This batch already has 20 documents." }, { status: 400 });

  const id = crypto.randomUUID();
  const path = `${batchId.data}/${id}-${safeName(file.name)}`;
  const admin = createAdminClient();
  const uploaded = await admin.storage.from("batch-files").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return NextResponse.json({ error: "The document could not be saved." }, { status: 400 });
  const inserted = await session.supabase.from("inventory_batch_request_files").insert({
    id,
    batch_id: batchId.data,
    name: file.name.slice(0, 180) || "document",
    path,
    content_type: file.type,
  });
  if (inserted.error) {
    await admin.storage.from("batch-files").remove([path]);
    return NextResponse.json({ error: "The document could not be saved." }, { status: 400 });
  }
  await session.supabase.rpc("record_audit", {
    p_action: "upload_batch_file",
    p_entity: "inventory_batch_request_files",
    p_entity_id: id,
    p_detail: { batchId: batchId.data },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, id });
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Batch documents are not ready yet." }, { status: 503 });
  }
  const url = new URL(request.url);
  const parsed = z.uuid().safeParse(url.searchParams.get("id"));
  if (!parsed.success) return NextResponse.json({ error: "Choose a document." }, { status: 400 });
  const found = await gate.session.supabase
    .from("inventory_batch_request_files")
    .select("id, name, path, content_type, deleted_at")
    .eq("id", parsed.data)
    .maybeSingle();
  if (found.error || !found.data || found.data.deleted_at) {
    return NextResponse.json({ error: "That document could not be loaded." }, { status: 404 });
  }
  const admin = createAdminClient();
  const file = await admin.storage.from("batch-files").download(found.data.path);
  if (file.error || !file.data) return NextResponse.json({ error: "That document could not be loaded." }, { status: 502 });
  const download = url.searchParams.get("download") === "1";
  const filename = found.data.name.replace(/["\r\n]/g, "");
  return new NextResponse(new Uint8Array(await file.data.arrayBuffer()), {
    headers: {
      "Content-Type": found.data.content_type || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = removeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a document." }, { status: 400 });
  const removed = await gate.session.supabase
    .from("inventory_batch_request_files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("deleted_at", null);
  if (removed.error) return NextResponse.json({ error: "That document could not be removed." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
