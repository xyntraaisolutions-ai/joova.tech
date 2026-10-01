import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const querySchema = z.object({
  id: z.uuid(),
  kind: z.enum(["receipt", "invoice"]),
  format: z.enum(["view", "pdf"]).optional(),
});

export async function GET(request: Request) {
  const gate = await requirePortalApi(["support"]);
  if ("error" in gate && gate.error) return gate.error;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Return documents are not ready yet." }, { status: 503 });
  }
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    id: url.searchParams.get("id"),
    kind: url.searchParams.get("kind"),
    format: url.searchParams.get("format") === "pdf" ? "pdf" : "view",
  });
  if (!parsed.success) return NextResponse.json({ error: "Choose a return document." }, { status: 400 });

  const found = await gate.session.supabase
    .from("returns")
    .select("id, order_id, refund_receipt_path, refund_invoice_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (found.error || !found.data) return NextResponse.json({ error: "That return could not be loaded." }, { status: 400 });
  const path = parsed.data.kind === "receipt" ? found.data.refund_receipt_path : found.data.refund_invoice_path;
  if (!path) return NextResponse.json({ error: "That document is not saved yet." }, { status: 404 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Return documents are not ready yet." }, { status: 503 });
  const file = await admin.storage.from("return-files").download(path);
  if (file.error || !file.data) return NextResponse.json({ error: "That document could not be loaded." }, { status: 502 });
  const bytes = new Uint8Array(await file.data.arrayBuffer());
  const name = parsed.data.kind === "receipt" ? "refund-receipt" : "refund-invoice";
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${parsed.data.format === "pdf" ? "attachment" : "inline"}; filename="${name}-${found.data.order_id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
