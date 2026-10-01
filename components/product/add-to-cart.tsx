"use client";

import Link from "next/link";
import { useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { cartLineId, purchaseDetails, purchaseText, type PurchaseSelection } from "@/lib/content/variants";
import { cn } from "@/lib/utils";

export function AddToCart({
  id,
  name,
  price,
  colors,
  selection,
  sku,
  warrantyNote,
}: {
  id: string;
  name: string;
  price: number;
  colors?: readonly string[];
  selection?: PurchaseSelection;
  sku?: string;
  warrantyNote?: string;
}) {
  const { policies } = useSiteContent();
  const { addItem } = useCart();
  const [color, setColor] = useState(colors?.[0]);
  const chosen: PurchaseSelection = selection ?? { color, sku };
  const details = purchaseDetails(chosen);
  const summary = purchaseText(chosen);

  const add = () =>
    addItem({
      id: cartLineId(id, chosen),
      productId: id,
      name,
      price,
      sku: chosen.sku,
      selection: chosen,
      color: chosen.color,
    });

  return (
    <div className="mt-6">
      {!selection && colors && colors.length > 1 ? (
        <div>
          <p className="text-sm font-medium">Color</p>
          <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label={`${name} colors`}>
            {colors.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === color}
                onClick={() => setColor(option)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm",
                  option === color ? "border-ink" : "border-stone",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {details.length ? (
        <div className="rounded-3xl border border-stone bg-white p-4">
          <p className="text-sm font-bold">Adding to cart</p>
          <p className="mt-1 font-medium">{name}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {details.map((row) => (
              <li key={row.label}><span className="text-muted">{row.label}</span> {row.value}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button
        className="mt-6 w-full sm:w-auto"
        onClick={add}
      >
        Add to cart
      </Button>
      <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
      <p className="mt-1 text-sm">
        <Link className="font-bold text-ink underline" href="/warranty">Warranty</Link>
        {warrantyNote ? <span className="text-muted"> · {warrantyNote}</span> : <span className="text-muted"> · 1 year, plus 1 extra year when you register.</span>}
      </p>
      <StickyBuyBar label={summary ? `${name} · ${summary}` : name} price={price} onBuy={add} />
    </div>
  );
}
