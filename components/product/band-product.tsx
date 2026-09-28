"use client";

import { useState } from "react";
import Link from "next/link";
import { bandVariants, policies, PREORDER_SHORT, PRICE, SHIP_DATE, strapPriceLabel, type BandVariant } from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { Gallery, Quantity } from "@/components/product/gallery";
import { strapCartItem, StrapColorChoices } from "@/components/product/strap-colors";
import { InTheBox } from "@/components/product/in-the-box";
import { SpecsTable } from "@/components/product/specs-table";
import { UseAndCare } from "@/components/product/use-and-care";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatUsd } from "@/lib/utils";

export function BandProduct() {
  const [worn, setWorn] = useState<BandVariant>(bandVariants[0]);
  const [extra, setExtra] = useState<BandVariant>(bandVariants[1]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const add = () => addItem(strapCartItem(worn, extra, quantity));

  return (
    <>
      <Container id="buy" className="scroll-mt-24 grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <Gallery
          variants={bandVariants}
          selected={worn}
          onSelect={setWorn}
        />
        <div>
          <h1
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Faceless Fitness Tracker Band
          </h1>
          <p className="mt-3 text-2xl">{formatUsd(PRICE)}</p>
          <Badge className="mt-4">No subscription. Ever.</Badge>
          <p className="mt-6 text-muted">
            Joova Band. Screenless fitness tracker. 2 straps in every box. Launches {SHIP_DATE}.
          </p>
          <div className="mt-8">
            <StrapColorChoices
              worn={worn}
              extra={extra}
              onWorn={setWorn}
              onExtra={setExtra}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            Strap fits wrist range [CONFIRM].{" "}
            <Link className="underline" href="#straps">
              Buy a strap on its own for {strapPriceLabel} each.
            </Link>
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm text-muted">Quantity</p>
            <Quantity value={quantity} onChange={setQuantity} />
          </div>
          <Button className="mt-8 w-full sm:w-auto" onClick={add}>
            Add to cart
          </Button>
          <Button variant="secondary" className="mt-3 w-full sm:ml-3 sm:w-auto" disabled>
            Shop Pay (when Shopify is connected)
          </Button>
          <p className="mt-4 text-sm text-muted">
            Pre-order before {PREORDER_SHORT} · Launches {SHIP_DATE} · Free US shipping
          </p>
          <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
          <p className="mt-3 text-sm text-muted">
            <Link className="underline" href="/returns">
              {policies.returnsTitle}
            </Link>
            {" · "}
            <Link className="underline" href="/warranty">
              {policies.strapTitle}
            </Link>
            {" · "}
            <Link className="underline" href="/warranty">
              {policies.dockTitle}
            </Link>{" "}
            starts when you submit the warranty form.
          </p>
        </div>
      </Container>
      <Container className="space-y-12 py-4 md:space-y-16 md:py-8">
        <section>
          <h2 className="font-display mb-4 text-3xl font-extrabold">
            What&apos;s in the box
          </h2>
          <InTheBox />
        </section>
        <section>
          <h2 className="font-display mb-4 text-3xl font-extrabold">
            Battery, charging, and care
          </h2>
          <UseAndCare />
        </section>
        <section>
          <h2 className="font-display mb-4 text-3xl font-extrabold">Specs</h2>
          <SpecsTable />
        </section>
        <section>
          <h2 className="font-display mb-4 text-3xl font-extrabold">
            Compare the price model
          </h2>
          <p className="max-w-2xl text-muted">
            Joova is a one-time purchase. A typical subscription tracker charges
            monthly for the app. We do not use competitor trademarks in images.
            Figures for monthly examples are labeled as examples.
          </p>
        </section>
      </Container>
      <StickyBuyBar label={`${worn.name} + ${extra.name}`} onBuy={add} />
    </>
  );
}
