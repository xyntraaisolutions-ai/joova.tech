"use client";

import Link from "next/link";
import { useCart } from "@/components/layout/cart-provider";
import { PaymentNote } from "@/components/shop/payment-note";
import { Button } from "@/components/ui/button";
import { purchaseText } from "@/lib/content/variants";
import { formatUsd } from "@/lib/utils";

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {items.length === 0 ? (
        <div>
          <p className="text-muted">Your cart is empty.</p>
          <Link className="mt-4 inline-flex font-bold text-ink underline" href="/shop">Shop Joova</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-3xl border border-stone bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.name}</p>
                  {purchaseText(item.selection, item.color) ? (
                    <p className="text-sm text-muted">{purchaseText(item.selection, item.color)}</p>
                  ) : null}
                  <p className="mt-1">{formatUsd(item.price)}</p>
                </div>
                <button type="button" className="inline-flex min-h-11 items-center text-sm underline" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button type="button" className="size-11 rounded-full border border-stone" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button>
                <span>{item.quantity}</span>
                <button type="button" className="size-11 rounded-full border border-stone" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <aside className="h-fit rounded-3xl border border-stone bg-white p-5">
        <p className="flex justify-between font-bold"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></p>
        <p className="mt-2 text-sm text-muted">Free US shipping. Delivered in 7 to 10 days.</p>
        <div className="mt-4"><PaymentNote /></div>
        {items.length > 0 ? (
          <Link href="/checkout" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-bold text-[var(--fixed-ink)]">
            Review and pay
          </Link>
        ) : (
          <Button className="mt-4 w-full" disabled>Review and pay</Button>
        )}
      </aside>
    </div>
  );
}
