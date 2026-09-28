"use client";

import { useState } from "react";
import { policies } from "@/content/site";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCart({
  id,
  name,
  price,
  colors,
}: {
  id: string;
  name: string;
  price: number;
  colors?: readonly string[];
}) {
  const { addItem } = useCart();
  const [color, setColor] = useState(colors?.[0]);

  const add = () =>
    addItem({
      id: color ? `${id}-${color.toLowerCase().replace(/\s+/g, "-")}` : id,
      name,
      price,
      color,
    });

  return (
    <div className="mt-6">
      {colors && colors.length > 1 ? (
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
      <Button
        className="mt-6 w-full sm:w-auto"
        onClick={add}
      >
        Add to cart
      </Button>
      <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
      <StickyBuyBar label={color ? `${name}, ${color}` : name} price={price} onBuy={add} />
    </div>
  );
}
