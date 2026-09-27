"use client";

import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";
import { PRICE } from "@/content/site";

export function StickyBuyBar({
  onBuy,
  label,
}: {
  onBuy: () => void;
  label: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone bg-paper/95 p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{label}</p>
          <p className="text-sm text-muted">{formatUsd(PRICE)}</p>
        </div>
        <Button onClick={onBuy}>Add to cart</Button>
      </div>
    </div>
  );
}
