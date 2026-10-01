import { NextResponse } from "next/server";
import { z } from "zod";
import { imageSize } from "@/lib/brand/logo";
import { requirePortalApi } from "@/lib/portal/api";

const types = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"), id: z.uuid() }),
  z.object({
    action: z.literal("delete"),
    id: z.uuid(),
    reason: z.string().trim().min(3).max(500),
  }),
]);

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { data, error } = await gate.session.supabase
    .from("brand_logos")
    .select("id, url, width, height, active, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Logos could not be loaded." }, { status: 400 });
  return NextResponse.json({ logos: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) return upload(session, viewAs, await request.formData());

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the logo form." }, { status: 400 });
  if (parsed.data.action === "activate") return activate(session, viewAs, parsed.data.id);
  return remove(session, viewAs, parsed.data.id, parsed.data.reason);
}

async function upload(
  session: Awaited<ReturnType<typeof requirePortalApi>> extends infer Gate
    ? Gate extends { session: infer Session }
      ? Session
      : never
    : never,
  viewAs: string,
  form: FormData,
) {
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a logo image." }, { status: 400 });
  const extension = types.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use a PNG, JPEG, GIF, or WebP file." }, { status: 400 });
  if (file.size > 2_000_000) return NextResponse.json({ error: "Logo images have to be under 2 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const size = imageSize(bytes, file.type);
  if (!size || size.width < 1 || size.height < 1 || size.width > 8000 || size.height > 8000) {
    return NextResponse.json({ error: "That image could not be read." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const storagePath = `logos/${id}.${extension}`;
  const uploaded = await session.supabase.storage.from("media").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return NextResponse.json({ error: "The logo could not be uploaded." }, { status: 400 });
  const url = session.supabase.storage.from("media").getPublicUrl(storagePath).data.publicUrl;
  const inserted = await session.supabase.from("brand_logos").insert({
    id,
    storage_path: storagePath,
    url,
    width: size.width,
    height: size.height,
    active: false,
  });
  if (inserted.error) {
    await session.supabase.storage.from("media").remove([storagePath]);
    return NextResponse.json({ error: "The logo could not be saved." }, { status: 400 });
  }
  const active = await session.supabase.rpc("set_brand_logo_active", { p_id: id });
  if (active.error) return NextResponse.json({ error: "The logo was saved, but it could not be set as primary." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: "upload_logo",
    p_entity: "brand_logos",
    p_entity_id: id,
    p_detail: { url },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}

async function activate(
  session: Awaited<ReturnType<typeof requirePortalApi>> extends infer Gate
    ? Gate extends { session: infer Session }
      ? Session
      : never
    : never,
  viewAs: string,
  id: string,
) {
  const active = await session.supabase.rpc("set_brand_logo_active", { p_id: id });
  if (active.error) return NextResponse.json({ error: "That logo could not be set as primary." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: "set_primary_logo",
    p_entity: "brand_logos",
    p_entity_id: id,
    p_detail: {},
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}

async function remove(
  session: Awaited<ReturnType<typeof requirePortalApi>> extends infer Gate
    ? Gate extends { session: infer Session }
      ? Session
      : never
    : never,
  viewAs: string,
  id: string,
  reason: string,
) {
  const found = await session.supabase.from("brand_logos").select("id, url, storage_path, active").eq("id", id).maybeSingle();
  if (found.error || !found.data) return NextResponse.json({ error: "That logo could not be found." }, { status: 400 });
  const storagePath = found.data.storage_path ?? "";
  if (storagePath.startsWith("logos/") && !storagePath.includes("..")) {
    const removed = await session.supabase.storage.from("media").remove([storagePath]);
    if (removed.error) return NextResponse.json({ error: "The logo file could not be deleted." }, { status: 400 });
  }
  const deleted = await session.supabase.from("brand_logos").delete().eq("id", id);
  if (deleted.error) return NextResponse.json({ error: "The logo could not be deleted." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: "delete_logo",
    p_entity: "brand_logos",
    p_entity_id: id,
    p_detail: { reason, url: found.data.url, active: found.data.active },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
