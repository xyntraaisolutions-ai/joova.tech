type OriginRef = { order_id?: string | null } | { order_id?: string | null }[] | null | undefined;

export function linkedOrderId(value: OriginRef) {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.order_id?.trim() || "";
}

export function orderOrigin(order: {
  order_kind?: string | null;
  orderKind?: string | null;
  warranty_claims?: OriginRef;
  source_return?: OriginRef;
  sourceOrderId?: string | null;
}) {
  const kind = order.orderKind || order.order_kind || "";
  if (kind !== "warranty" && kind !== "exchange") return null;
  const source = order.sourceOrderId || linkedOrderId(kind === "warranty" ? order.warranty_claims : order.source_return);
  return {
    kind,
    label: kind === "warranty" ? "Warranty" : "Exchange",
    sourceOrderId: source,
  };
}
