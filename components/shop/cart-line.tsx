"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/components/layout/cart-provider";
import { useSiteContent } from "@/components/layout/site-content";
import { ProductCard } from "@/components/shop/product-card";
import { purchaseText } from "@/lib/content/variants";
import { formatUsd } from "@/lib/utils";

export function CartLine({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
}) {
  const { catalog } = useSiteContent();
  const product = catalog.find((entry) => entry.id === item.productId);
  const href = product?.href;
  const image = product?.image;

  return (
    <div className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex items-start gap-3">
        {image?.src ? (
          href ? (
            <Link href={href} className="size-20 shrink-0 overflow-hidden rounded-2xl bg-stone/40">
              <Image src={image.src} alt="" width={160} height={160} className="size-full object-contain" />
            </Link>
          ) : (
            <span className="size-20 shrink-0 overflow-hidden rounded-2xl bg-stone/40">
              <Image src={image.src} alt="" width={160} height={160} className="size-full object-contain" />
            </span>
          )
        ) : (
          <span className="size-20 shrink-0 rounded-2xl bg-stone/40" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {href ? (
                <Link href={href} className="font-bold hover:underline">{item.name}</Link>
              ) : (
                <p className="font-bold">{item.name}</p>
              )}
              {purchaseText(item.selection, item.color) ? (
                <p className="text-sm text-muted">{purchaseText(item.selection, item.color)}</p>
              ) : null}
              <p className="mt-1">{formatUsd(item.price)}</p>
            </div>
            <button type="button" className="inline-flex min-h-11 shrink-0 items-center text-sm underline" onClick={onRemove}>
              Remove
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className="size-11 rounded-full border border-stone" onClick={() => onQuantity(item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button>
            <span>{item.quantity}</span>
            <button type="button" className="size-11 rounded-full border border-stone" onClick={() => onQuantity(item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyCartPicks() {
  const { catalog } = useSiteContent();
  const picks = catalog
    .filter((product) => product.price > 0 && !product.unpriced && product.availability !== "out_of_stock")
    .slice(0, 2);

  return (
    <div>
      <p className="text-muted">Your cart is empty.</p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-bold text-ink underline" href="/shop">
        Shop Joova
      </Link>
      {picks.length ? (
        <ul className="mt-6 grid gap-4">
          {picks.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CartCoverageNote() {
  const { policies } = useSiteContent();
  return (
    <p className="text-sm text-muted">
      {policies.returnsTitle}. {policies.shipping}
    </p>
  );
}
