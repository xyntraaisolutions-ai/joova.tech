"use client";

import { useWishlist } from "@/components/layout/wishlist-provider";
import { Button } from "@/components/ui/button";

export function SaveForLater({
  id,
  name,
  href,
  note,
}: {
  id: string;
  name: string;
  href: string;
  note: string;
}) {
  const { has, addItem, removeItem } = useWishlist();
  const saved = has(id);

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{note}</p>
      <Button
        className="mt-3 w-full sm:w-auto"
        variant={saved ? "secondary" : "primary"}
        onClick={() => (saved ? removeItem(id) : addItem({ id, name, href, note }))}
      >
        {saved ? "Remove from wishlist" : "Add to wishlist"}
      </Button>
    </div>
  );
}
