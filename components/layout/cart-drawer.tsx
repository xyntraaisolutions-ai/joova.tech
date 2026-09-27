"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";

export function CartDrawer() {
  const { items, open, setOpen, updateQuantity, removeItem, subtotal } =
    useCart();

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
              <p className="text-muted">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.color ? (
                        <p className="text-sm text-muted">{item.color}</p>
                      ) : null}
                      <p className="mt-1">{formatUsd(item.price)}</p>
                    </div>
                    <button
                      className="inline-flex min-h-11 items-center text-sm text-coral-ink underline"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      className="size-11 rounded-full border border-stone"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="size-11 rounded-full border border-stone"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-stone pt-4">
            <p className="mb-2 flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatUsd(subtotal)}</span>
            </p>
            <p className="mb-4 text-sm text-muted">
              Ships Nov 18, 2026. Checkout will hand off to Shopify. Card
              details are never collected on this site.
            </p>
            <Button className="w-full" disabled>
              Checkout coming soon
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
