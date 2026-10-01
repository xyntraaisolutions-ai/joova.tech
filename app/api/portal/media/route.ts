import { NextResponse } from "next/server";
import { requirePortalApi } from "@/lib/portal/api";

const types = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"]);

export async function GET() {
  const gate = await requirePortalApi(["content", "inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { data, error } = await gate.session.supabase.storage.from("media").list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ files: [] });
  const files = (data ?? [])
    .filter((file) => file.name && file.id)
    .map((file) => {
      const url = gate.session.supabase.storage.from("media").getPublicUrl(file.name).data.publicUrl;
      return { name: file.name, url };
    });
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["content", "inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (!types.has(file.type)) return NextResponse.json({ error: "Use a JPEG, PNG, WebP, GIF, or MP4 file." }, { status: 400 });
  const limit = file.type === "video/mp4" ? 40_000_000 : 8_000_000;
  if (file.size > limit) {
    return NextResponse.json({ error: file.type === "video/mp4" ? "Videos have to be under 40 MB." : "Pictures have to be under 8 MB." }, { status: 400 });
  }
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
  const path = `${Date.now()}-${safe || "upload"}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await gate.session.supabase.storage.from("media").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: "The file could not be uploaded." }, { status: 400 });
  const url = gate.session.supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  await gate.session.supabase.rpc("record_audit", {
    p_action: "upload_media",
    p_entity: "media",
    p_entity_id: path,
    p_detail: { url },
    p_view_as: gate.viewAs,
  });
  return NextResponse.json({ ok: true, url, name: path });
}
