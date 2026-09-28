"use client";

import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { SHARE_PRICE } from "@/content/site";

export function ShareBuy() {
  const { addItem } = useCart();

  return (
    <Button
      className="mt-6 w-full sm:w-auto"
      onClick={() =>
        addItem({
          id: "share",
          name: "Joova Share",
          price: SHARE_PRICE,
        })
      }
    >
      Add to cart
    </Button>
  );
}
