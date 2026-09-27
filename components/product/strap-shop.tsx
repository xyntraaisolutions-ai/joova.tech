"use client";

import { useState } from "react";
import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import { useCart } from "@/components/layout/cart-provider";
import { strapOnlyCartItem } from "@/components/product/strap-colors";
import { Button } from "@/components/ui/button";
import { bandImageSize, bandVariants, strapPriceLabel } from "@/content/site";

function StrapCard({ variant }: { variant: (typeof bandVariants)[number] }) {
  const { addItem, setOpen } = useCart();
  const [quantity, setQuantity] = useState(1);

  return (
    <li className="stage flex flex-col rounded-3xl border border-stone p-5">
      <ProductTurntable>
        <BandPhoto
          src={variant.image}
          alt={`${variant.name} woven strap`}
          width={bandImageSize.width}
          height={bandImageSize.height}
          frameClassName="mx-auto"
          className="h-64 w-auto"
        />
      </ProductTurntable>
      <h2 className="mt-4 font-display text-2xl font-semibold">{variant.name}</h2>
      <p className="text-sm text-muted">Woven strap · No tracker</p>
      <p className="mt-2 font-medium">{strapPriceLabel} each</p>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="size-11 rounded-full border border-stone"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          aria-label={`Decrease ${variant.name} straps`}
        >
          −
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          className="size-11 rounded-full border border-stone"
          onClick={() => setQuantity((value) => value + 1)}
          aria-label={`Increase ${variant.name} straps`}
        >
          +
        </button>
      </div>
      <Button
        className="mt-4 w-full"
        onClick={() => {
          addItem(strapOnlyCartItem(variant, quantity));
          setOpen(true);
        }}
      >
        Add strap
      </Button>
    </li>
  );
}

export function StrapShop() {
  return (
    <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {bandVariants.map((variant) => (
        <StrapCard key={variant.id} variant={variant} />
      ))}
    </ul>
  );
}
