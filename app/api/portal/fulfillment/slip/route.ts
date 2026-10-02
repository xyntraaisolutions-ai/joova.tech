import { NextResponse } from "next/server";
import { purchaseText } from "@/lib/content/variants";
import { packingSlipPdf } from "@/lib/mail/packing-slip";
import { requirePortalApi } from "@/lib/portal/api";

export async function GET(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const orderId = new URL(request.url).searchParams.get("order")?.trim().toUpperCase() ?? "";
  if (!orderId) return NextResponse.json({ error: "Choose an order." }, { status: 400 });
  const found = await gate.session.supabase
    .from("orders")
    .select("id, email, payment_status, shipping, order_items(name, quantity, color, selection), shipments(carrier, tracking_number)")
    .eq("id", orderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (found.error || !found.data) return NextResponse.json({ error: "That order could not be loaded." }, { status: 400 });
  if (found.data.payment_status !== "paid") return NextResponse.json({ error: "A packing slip is ready after the order is paid." }, { status: 400 });
  const shipment = Array.isArray(found.data.shipments) ? found.data.shipments[0] : null;
  const items = (found.data.order_items ?? []).map((item) => {
    const selection = item.selection as { color?: string; type?: string; size?: string; custom?: string; sku?: string } | null;
    return {
      name: item.name,
      quantity: item.quantity,
      sku: selection?.sku,
      detail: purchaseText(selection, item.color ?? undefined),
    };
  });
  const pdf = await packingSlipPdf({
    orderId: found.data.id,
    email: found.data.email,
    shipping: (found.data.shipping ?? {}) as { name?: string; line1?: string; line2?: string; city?: string; region?: string; postal?: string },
    items,
    carrier: shipment?.carrier,
    tracking: shipment?.tracking_number,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="joova-packing-${found.data.id}.pdf"`,
    },
  });
}
