"use client";

import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";
import { PRICE } from "@/content/site";

export function StickyBuyBar({
  onBuy,
  label,
  price = PRICE,
}: {
  onBuy: () => void;
  label: string;
  price?: number;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 border-t border-stone bg-paper/95 p-3 backdrop-blur md:hidden"
      style={{ bottom: "calc(var(--app-tab) + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{label}</p>
          <p className="text-sm text-muted">{formatUsd(price)}</p>
        </div>
        <Button onClick={onBuy}>Add to cart</Button>
      </div>
    </div>
  );
}
