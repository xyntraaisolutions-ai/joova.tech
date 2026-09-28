"use client";

import { useState } from "react";
import Link from "next/link";
import { bandVariants, includedExtra, noSubscription, policies, PRICE, strapPriceLabel, type BandVariant } from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { Gallery, Quantity } from "@/components/product/gallery";
import { strapCartItem, StrapColorChoices } from "@/components/product/strap-colors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatUsd } from "@/lib/utils";

export function BandProduct() {
  const [worn, setWorn] = useState<BandVariant>(bandVariants[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const extra = includedExtra(worn);

  const add = () => addItem(strapCartItem(worn, extra, quantity));

  return (
    <>
      <Container id="buy" className="scroll-mt-24 grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <div className="min-w-0">
          <Gallery
            variants={bandVariants}
            selected={worn}
            onSelect={setWorn}
          />
        </div>
        <div className="min-w-0">
          <h1
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Joova Band
          </h1>
          <p className="mt-3 font-display text-3xl font-semibold">Track everything. Pay once.</p>
          <p className="mt-3 text-2xl">{formatUsd(PRICE)}</p>
          <Badge className="mt-4">{noSubscription}</Badge>
          <p className="mt-6 text-muted">
            A light, screenless fitness tracker for sleep, heart rate, and daily
            activity, shown in the free Joova app. No screen to distract you, and
            no monthly bill. Ever.
          </p>
          <div className="mt-8">
            <StrapColorChoices worn={worn} onWorn={setWorn} />
          </div>
          <p className="mt-4 text-sm text-muted">
            Fits wrists about 14–22 cm (5.5–8.7 in).{" "}
            <Link className="underline" href="#straps">
              Buy a strap on its own for {strapPriceLabel} each.
            </Link>
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-2 text-sm text-muted">Quantity</p>
              <Quantity value={quantity} onChange={setQuantity} />
            </div>
            <Button onClick={add}>Add to cart</Button>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>Available now · Free US shipping</li>
            <li>{policies.shipping}</li>
            <li>
              <Link className="underline" href="/returns">
                {policies.returnsTitle}
              </Link>
            </li>
            <li>
              <Link className="underline" href="/warranty">
                {policies.strapTitle}
              </Link>
            </li>
            <li>
              <Link className="underline" href="/warranty">
                {policies.dockTitle}
              </Link>{" "}
              starts when you register the band in your Joova Customer Account.
            </li>
          </ul>
        </div>
      </Container>
      <StickyBuyBar label={`${worn.name} + ${extra.name}`} onBuy={add} />
    </>
  );
}
