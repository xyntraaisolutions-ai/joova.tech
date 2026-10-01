export function toCents(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

export function lineCents(unitPrice: number, unitDiscount: number, quantity: number) {
  return (toCents(unitPrice) - toCents(unitDiscount)) * quantity;
}

export function batchTotals(
  items: { unitPrice: number; unitDiscount: number; quantity: number }[],
  shipping: number,
  misc: number,
) {
  const itemsCents = items.reduce((sum, item) => sum + lineCents(item.unitPrice, item.unitDiscount, item.quantity), 0);
  const shippingCents = toCents(shipping);
  const miscCents = toCents(misc);
  return {
    quantity: items.reduce((sum, item) => sum + Math.max(0, Math.trunc(item.quantity) || 0), 0),
    items: itemsCents / 100,
    shipping: shippingCents / 100,
    misc: miscCents / 100,
    total: (itemsCents + shippingCents + miscCents) / 100,
  };
}
