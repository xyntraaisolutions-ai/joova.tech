"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { CoverageLines } from "@/components/shop/coverage-lines";
import { coverageFromCatalog, type ProductCoverage } from "@/lib/catalog/coverage";
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
  coverage,
  availableCount,
}: {
  id: string;
  name: string;
  price: number;
  colors?: readonly string[];
  selection?: PurchaseSelection;
  sku?: string;
  warrantyNote?: string;
  coverage?: ProductCoverage;
  availableCount?: number;
}) {
  const { policies } = useSiteContent();
  const { addItem } = useCart();
  const [color, setColor] = useState(colors?.[0]);
  const [quantity, setQuantity] = useState(1);
  const buyRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const chosen: PurchaseSelection = selection ?? { color, sku };
  const details = purchaseDetails(chosen);
  const summary = purchaseText(chosen);
  const cap = typeof availableCount === "number" && availableCount > 0 ? availableCount : undefined;
  const label = summary ? `${name} · ${summary}` : name;

  useEffect(() => {
    const node = buyRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      const above = entry.boundingClientRect.top < 0;
      setPinned(!entry.isIntersecting && above);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const add = () =>
    addItem({
      id: cartLineId(id, chosen),
      productId: id,
      name,
      price,
      sku: chosen.sku,
      selection: chosen,
      color: chosen.color,
      quantity,
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
      <div className="mt-6 flex items-center gap-3">
        <p className="text-sm font-medium">Quantity</p>
        <button
          type="button"
          className="size-11 rounded-full border border-stone"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
        >
          −
        </button>
        <span className="min-w-6 text-center">{quantity}</span>
        <button
          type="button"
          className="size-11 rounded-full border border-stone disabled:opacity-40"
          aria-label="Increase quantity"
          disabled={cap !== undefined && quantity >= cap}
          onClick={() => setQuantity((current) => (cap !== undefined ? Math.min(cap, current + 1) : current + 1))}
        >
          +
        </button>
      </div>
      <div ref={buyRef} className="mt-6 w-full sm:w-fit">
        <Button className="w-full sm:w-auto" onClick={add}>
          Add to cart
        </Button>
      </div>
      <CoverageLines coverage={coverage ?? coverageFromCatalog({ id, name })} />
      <p className="mt-2 text-sm">
        <Link className="font-bold text-ink underline" href="/warranty">Warranty policy</Link>
        {warrantyNote ? <span className="text-muted"> · {warrantyNote}</span> : null}
        {" · "}
        <Link className="font-bold text-ink underline" href="/returns">Returns</Link>
      </p>
      <p className="mt-1 text-sm text-muted">{policies.shipping}</p>
      {pinned ? (
        <StickyBuyBar
          label={quantity > 1 ? `${label} · Qty ${quantity}` : label}
          price={price * quantity}
          onBuy={add}
        />
      ) : null}
    </div>
  );
}
