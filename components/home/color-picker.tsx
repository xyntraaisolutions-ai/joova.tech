"use client";

import { BandPhoto } from "@/components/media/band-photo";
import { useState } from "react";
import { bandVariants, type BandVariant } from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { formatUsd } from "@/lib/utils";

export function ColorPicker() {
  const [selected, setSelected] = useState<BandVariant>(bandVariants[0]);
  const { addItem } = useCart();

  return (
    <Section id="colors">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="stage flex justify-center rounded-[28px] p-8">
          <BandPhoto
            src={selected.image}
            alt={`Joova Band in ${selected.name}`}
            width={520}
            height={750}
            className="h-auto max-h-[560px] w-auto"
            sizes="(min-width: 1024px) 520px, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            Five colors
          </p>
          <h2
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Woven loop. Silver buckle. Graphite tracker.
          </h2>
          <p className="mt-3 text-muted">
            Black, Blue, Green, Orange, and Red. Same band. Same price. The box
            matches the band inside.
          </p>
          <p className="mt-8 font-display text-3xl font-bold">{selected.name}</p>
          <p className="mt-1">
            {formatUsd(selected.price)} · {selected.status}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {bandVariants.map((variant) => {
              const pressed = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={variant.name}
                  onClick={() => setSelected(variant)}
                  className="flex items-center gap-2 rounded-full border border-stone bg-white px-3 py-2 text-sm aria-pressed:border-ink"
                >
                  <span
                    className="size-5 rounded-full border border-stone"
                    style={{ background: variant.strapHex }}
                    aria-hidden
                  />
                  {variant.name}
                </button>
              );
            })}
          </div>
          <Button
            className="mt-8"
            onClick={() =>
              addItem({
                id: selected.id,
                name: "Joova Band",
                price: selected.price,
                color: selected.name,
              })
            }
          >
            Add to cart
          </Button>
        </div>
      </Container>
    </Section>
  );
}
