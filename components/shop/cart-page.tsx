"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { PaymentNote } from "@/components/shop/payment-note";
import { CartCoverageNote, CartLine, EmptyCartPicks } from "@/components/shop/cart-line";
import { InternalCheckoutDialog } from "@/components/shop/internal-checkout-dialog";
import { Button } from "@/components/ui/button";
import { isRole, isStaff } from "@/lib/portal/roles";
import { formatUsd } from "@/lib/utils";

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const [staffCheckout, setStaffCheckout] = useState(false);
  const internal = isRole(user?.role) && isStaff(user.role);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {items.length === 0 ? (
        <EmptyCartPicks />
      ) : (
        <div className="space-y-4">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <CartLine item={item} onRemove={() => removeItem(item.id)} onQuantity={(quantity) => updateQuantity(item.id, quantity)} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <aside className="h-fit rounded-3xl border border-stone bg-white p-5">
        <p className="flex justify-between font-bold"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></p>
        {items.length > 0 ? <div className="mt-2"><CartCoverageNote /></div> : null}
        <div className="mt-4"><PaymentNote /></div>
        {items.length > 0 && internal ? (
          <Button className="mt-4 w-full" type="button" onClick={() => setStaffCheckout(true)}>Review and pay</Button>
        ) : items.length > 0 ? (
          <Link href="/checkout" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-bold text-[var(--fixed-ink)]">
            Review and pay
          </Link>
        ) : (
          <Button className="mt-4 w-full" disabled>Review and pay</Button>
        )}
        <InternalCheckoutDialog open={staffCheckout} onOpenChange={setStaffCheckout} />
      </aside>
    </div>
  );
}
