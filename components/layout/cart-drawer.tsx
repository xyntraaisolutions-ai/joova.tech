"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils";

export function CartDrawer() {
  const { items, open, setOpen, updateQuantity, removeItem, clear, subtotal } =
    useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<"cart" | "choose" | "guest" | "done">("cart");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [orderId, setOrderId] = useState("");

  async function placeOrder(email?: string) {
    setError("");
    setPending(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        guestEmail: email,
      }),
    });
    const body = (await response.json().catch(() => null)) as {
      orderId?: string;
      error?: string;
    } | null;
    setPending(false);
    if (!response.ok || !body?.orderId) {
      setError(body?.error ?? "The order could not be saved.");
      return;
    }
    setOrderId(body.orderId);
    setStep("done");
    clear();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStep("cart");
          setError("");
        }
      }}
    >
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
            {step === "done" ? (
              <p role="status">
                Order {orderId} is saved. Payment will go through Shopify when
                checkout is connected.
              </p>
            ) : items.length === 0 ? (
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
                      className="inline-flex min-h-11 items-center text-sm text-ink underline"
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
              Available items ship from US warehouses in 7 to 10 days. Card
              details are never collected on this site.
            </p>
            {step === "done" ? (
              <p className="text-sm" role="status">
                Order {orderId} is saved. Payment will go through Shopify when
                checkout is connected.
              </p>
            ) : null}
            {step === "choose" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Sign in, register, or continue as a guest.
                </p>
                <Link
                  href="/account?mode=sign-in&next=checkout"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-bold text-[var(--fixed-ink)]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/account?mode=register&next=checkout"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-ink/15 font-bold"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
                <Button className="w-full" variant="secondary" onClick={() => setStep("guest")}>
                  Continue as guest
                </Button>
              </div>
            ) : null}
            {step === "guest" ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void placeOrder(guestEmail);
                }}
              >
                <label className="block">
                  <span className="text-sm text-ink">Email for this order</span>
                  <Input
                    className="mt-2"
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    autoComplete="email"
                  />
                </label>
                {error ? (
                  <p className="text-sm text-ink" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button className="w-full" type="submit" disabled={pending}>
                  Place guest order
                </Button>
              </form>
            ) : null}
            {step === "cart" ? (
              <>
                {error ? (
                  <p className="mb-3 text-sm text-ink" role="alert">
                    {error}
                  </p>
                ) : null}
                {user ? (
                  <p className="mb-3 text-sm text-muted">Signed in as {user.name}.</p>
                ) : null}
                <Button
                  className="w-full"
                  disabled={items.length === 0 || pending}
                  onClick={() => {
                    setError("");
                    if (user) void placeOrder();
                    else setStep("choose");
                  }}
                >
                  Checkout
                </Button>
              </>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
