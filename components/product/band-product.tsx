"use client";

import { useState } from "react";
import { bandVariants, PRICE, SHIP_DATE, type BandVariant } from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { Gallery, Quantity } from "@/components/product/gallery";
import { InTheBox } from "@/components/product/in-the-box";
import { SpecsTable } from "@/components/product/specs-table";
import { UseAndCare } from "@/components/product/use-and-care";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { faqs } from "@/content/site";
import { formatUsd } from "@/lib/utils";

export function BandProduct() {
  const [selected, setSelected] = useState<BandVariant>(bandVariants[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const add = () =>
    addItem({
      id: selected.id,
      name: "Joova Band",
      price: selected.price,
      color: selected.name,
      quantity,
    });

  return (
    <>
      <Container className="grid gap-10 py-12 pb-28 lg:grid-cols-2 md:pb-12">
        <Gallery
          variants={bandVariants}
          selected={selected}
          onSelect={setSelected}
        />
        <div>
          <h1
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Joova Band
          </h1>
          <p className="mt-3 text-2xl">{formatUsd(PRICE)}</p>
          <Badge className="mt-4">No subscription. Ever.</Badge>
          <p className="mt-6 text-muted">
            Screenless fitness tracker. 3 straps in every box. Ships {SHIP_DATE}.
          </p>
          <fieldset className="mt-8">
            <legend className="font-medium">Color</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {bandVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={variant.id === selected.id}
                  aria-label={variant.name}
                  onClick={() => setSelected(variant)}
                  className="flex items-center gap-2 rounded-full border border-stone px-3 py-2 text-sm aria-pressed:border-ink"
                >
                  <span
                    className="size-5 rounded-full border border-stone"
                    style={{ background: variant.strapHex }}
                    aria-hidden
                  />
                  {variant.name}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-4 text-sm text-muted">
            Strap fits wrist range [CONFIRM].
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
            Pre-order · Ships {SHIP_DATE} · Free US shipping
          </p>
        </div>
      </Container>
      <Container className="space-y-16 pb-28 md:pb-16">
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
        <section>
          <h2 className="font-display mb-4 text-3xl font-extrabold">FAQ</h2>
          <Accordion items={faqs} />
        </section>
      </Container>
      <StickyBuyBar label={selected.name} onBuy={add} />
    </>
  );
}
