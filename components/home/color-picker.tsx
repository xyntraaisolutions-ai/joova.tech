"use client";

import Link from "next/link";
import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import { useState } from "react";
import { bandImageSize, bandVariants, includedExtra, strapPriceLabel, type BandVariant } from "@/content/site";
import { strapCartItem, StrapColorChoices } from "@/components/product/strap-colors";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { formatUsd } from "@/lib/utils";

export function ColorPicker() {
  const [worn, setWorn] = useState<BandVariant>(bandVariants[0]);
  const extra = includedExtra(worn);
  const { addItem } = useCart();

  return (
    <Section id="colors">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="stage flex justify-center rounded-[28px] p-8">
            <ProductTurntable>
              <BandPhoto
                src={worn.image}
                alt={`Joova Band in ${worn.name}`}
                width={bandImageSize.width}
                height={bandImageSize.height}
                className="h-auto max-h-[560px] w-auto"
                sizes="(min-width: 1024px) 520px, 100vw"
              />
            </ProductTurntable>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            Five colors
          </p>
          <h2
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Woven loop. Silver buckle. Black tracker.
          </h2>
          <p className="mt-3 text-muted">
            Black, Blue, Green, Orange, and Red. The box includes the strap you
            wear and 1 extra. Black includes blue. Every other color includes black.
          </p>
          <p className="mt-8 font-display text-3xl font-bold">
            {worn.name} + {extra.name} extra
          </p>
          <p className="mt-1">
            {formatUsd(worn.price)} · {worn.status}
          </p>
          <div className="mt-6">
            <StrapColorChoices worn={worn} onWorn={setWorn} />
          </div>
          <Button className="mt-8" onClick={() => addItem(strapCartItem(worn, extra))}>
            Add to cart
          </Button>
          <p className="mt-4 text-sm text-muted">
            <Link className="underline" href="#straps">
              Or buy a strap on its own for {strapPriceLabel} each.
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
