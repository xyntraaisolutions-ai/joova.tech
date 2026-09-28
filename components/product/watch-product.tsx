"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/layout/cart-provider";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  WATCH_PRICE,
  noSubscription,
  policies,
  watchImageSize,
  watchPriceLabel,
  watchVariants,
} from "@/content/site";
import { cn } from "@/lib/utils";

export function WatchProduct() {
  const { addItem } = useCart();
  const [colorId, setColorId] = useState<(typeof watchVariants)[number]["id"]>("black");
  const selected = watchVariants.find((variant) => variant.id === colorId) ?? watchVariants[0];
  const add = () =>
    addItem({
      id: `watch-${selected.id}`,
      name: "Joova Watch",
      price: WATCH_PRICE,
      color: selected.name,
    });

  return (
    <>
    <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
      <div className="stage rounded-[24px] p-4 sm:p-6">
        <Image
          src={selected.image}
          alt={selected.alt}
          width={watchImageSize.width}
          height={watchImageSize.height}
          priority
          className="h-auto w-full"
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
          Smart watch
        </p>
        <h1 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
          Joova Watch
        </h1>
        <p className="mt-3 font-display text-3xl font-semibold">
          Calls on your wrist. No subscription.
        </p>
        <p className="mt-3 text-2xl">{watchPriceLabel}</p>
        <Badge className="mt-4">{noSubscription}</Badge>
        <p className="mt-6 text-muted">
          A big-screen smart watch that takes calls, shows your notifications,
          and tracks your heart rate, sleep, and workouts. It works with iPhone
          and Android through the free Joova app. No monthly bill. Ever.
        </p>
        <div className="mt-6">
          <p className="text-sm font-medium">Color</p>
          <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Joova Watch colors">
            {watchVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                role="option"
                aria-selected={variant.id === selected.id}
                onClick={() => setColorId(variant.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm",
                  variant.id === selected.id ? "border-ink" : "border-stone",
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
        <Button className="mt-6 w-full sm:w-auto" onClick={add}>
          Add to cart
        </Button>
        <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
      </div>
    </Container>
    <StickyBuyBar label={`Joova Watch, ${selected.name}`} price={WATCH_PRICE} onBuy={add} />
    </>
  );
}
