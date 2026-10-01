"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogProduct } from "@/content/catalog";
import { cartLineId, type PurchaseSelection } from "@/lib/content/variants";

function defaultSelection(product: CatalogProduct): PurchaseSelection {
  const variant = product.variants?.find((item) => item.id === product.defaultVariantId)
    ?? product.variants?.find((item) => item.available !== false);
  if (!variant) return { sku: product.sku };
  return {
    color: variant.color,
    type: variant.type,
    size: variant.size,
    custom: variant.custom,
    sku: variant.sku || product.sku,
    labels: variant.labels,
  };
}

export function RequestItemButton({ product, className, size = "md" }: { product: CatalogProduct; className?: string; size?: "sm" | "md" }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const closeRequest = useCallback(() => setRequestOpen(false), []);
  return (
    <>
      <Button type="button" size={size} className={className} onClick={() => setRequestOpen(true)}>
        Request this item
      </Button>
      {requestOpen ? <RequestItem product={product} onClose={closeRequest} /> : null}
    </>
  );
}

export function ShopCardActions({ product }: { product: CatalogProduct }) {
  const outOfStock = product.availability === "out_of_stock";
  const canBuy = !outOfStock && !product.unpriced && product.price > 0;
  const choices = (product.variants ?? []).filter((option) => option.available !== false);
  const needsChoice = choices.length > 1;
  const { addItem } = useCart();

  function add() {
    const selection = defaultSelection(product);
    addItem({
      id: cartLineId(product.id, selection),
      productId: product.id,
      name: product.name,
      price: product.price,
      sku: selection.sku,
      selection,
      color: selection.color,
    });
  }

  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canBuy && !needsChoice ? (
        <Button type="button" className="w-full sm:w-fit" onClick={add}>
          Add to cart
        </Button>
      ) : null}
      {outOfStock ? <RequestItemButton product={product} className="w-full sm:w-fit" /> : null}
      <Link href={product.href} className={`${buttonClassName(canBuy && !needsChoice || outOfStock ? "secondary" : "primary")} w-full sm:w-fit`}>
        {needsChoice ? "Choose options" : "See Details"}
      </Link>
    </div>
  );
}

function RequestItem({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const { user } = useAuth();
  const titleId = useId();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (website) return;
    setError("");
    setSending(true);
    const response = await fetch("/api/shop/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        note,
        productId: product.id,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setSending(false);
    if (!response.ok) {
      setError(data.error ?? "The request could not be sent.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[min(90vh,40rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-paper p-6 text-ink shadow-lg">
        <h2 id={titleId} className="font-display text-2xl">Request this item</h2>
        <p className="mt-2 text-sm text-muted">
          {product.name} is out of stock. Send a request and we will email you when it is back.
        </p>
        {done ? (
          <div className="mt-4">
            <p role="status">We received your request for {product.name}.</p>
            <Button type="button" className="mt-6" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block text-sm">
              Name
              <Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" maxLength={80} />
            </label>
            <label className="block text-sm">
              Email
              <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className="block text-sm">
              Note
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3 text-[17px] text-ink"
                value={note}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tell us how many you need, or when you need them."
              />
            </label>
            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>
            </div>
            {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={sending}>{sending ? "Sending" : "Send request"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
