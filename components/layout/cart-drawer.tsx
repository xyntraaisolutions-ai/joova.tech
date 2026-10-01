"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/layout/cart-provider";
import { useSiteContent } from "@/components/layout/site-content";
import { PaymentNote } from "@/components/shop/payment-note";
import { CartCoverageNote, CartLine, EmptyCartPicks } from "@/components/shop/cart-line";
import { formatUsd } from "@/lib/utils";

export function CartDrawer() {
  const { items, open, setOpen, updateQuantity, removeItem, subtotal } = useCart();
  const { policies } = useSiteContent();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--fixed-ink)]/45" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-paper px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="font-display text-2xl">Cart</Dialog.Title>
            <Dialog.Close className="flex size-11 items-center justify-center rounded-full hover:bg-stone" aria-label="Close cart">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 space-y-4 overflow-auto">
            {items.length === 0 ? (
              <EmptyCartPicks />
            ) : (
              items.map((item) => (
                <CartLine key={item.id} item={item} onRemove={() => removeItem(item.id)} onQuantity={(quantity) => updateQuantity(item.id, quantity)} />
              ))
            )}
          </div>
          <div className="border-t border-stone pt-4">
            <p className="mb-2 flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatUsd(subtotal)}</span>
            </p>
            {items.length > 0 ? <div className="mb-3"><CartCoverageNote /></div> : <p className="mb-3 text-sm text-muted">{policies.shipping}</p>}
            <div className="mb-4"><PaymentNote /></div>
            {items.length > 0 ? (
              <Link
                href="/cart"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-bold text-[var(--fixed-ink)]"
                onClick={() => setOpen(false)}
              >
                Review cart
              </Link>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
