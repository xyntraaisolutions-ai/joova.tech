"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  policies,
  RING_PRICE,
  ringFacts,
  ringImageSize,
  ringPriceLabel,
  ringVariants,
  type RingVariant,
} from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export function RingProduct() {
  const [selected, setSelected] = useState<RingVariant>(ringVariants[0]);
  const { addItem } = useCart();

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    const match = ringVariants.find((ring) => ring.id === id);
    if (match) setSelected(match);
  }, []);

  const choose = (ring: RingVariant) => {
    setSelected(ring);
    window.history.replaceState(null, "", `#${ring.id}`);
  };

  return (
    <>
    <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
      <div className="stage rounded-[24px] p-6">
        <Image
          src={selected.image}
          alt={`Joova Smart Ring in ${selected.name}, ${selected.finish.toLowerCase()}`}
          width={ringImageSize.width}
          height={ringImageSize.height}
          priority
          className="mx-auto h-auto w-full max-w-lg"
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </div>
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
          Joova
        </p>
        <h1
          className="font-display mt-3 font-extrabold"
          style={{ fontSize: "var(--text-h1)" }}
        >
          Smart Ring
        </h1>
        <p className="mt-3 text-2xl">{ringPriceLabel}</p>
        <p className="mt-2 text-lg">{selected.name}</p>
        <Badge className="mt-4">No subscription. Ever.</Badge>
        <p className="mt-6 text-muted">{selected.summary}</p>
        <p className="mt-3 text-muted">
          A screenless ring for sleep, activity, and heart-rate trends. Wellness
          insights only. The inner window shows the sensor side: a small green
          indicator and a round sensor.
        </p>

        <div className="mt-8">
          <p className="text-sm font-medium">Finish</p>
          <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Smart Ring finishes">
            {ringVariants.map((ring) => (
              <button
                key={ring.id}
                type="button"
                role="option"
                aria-selected={ring.id === selected.id}
                onClick={() => choose(ring)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm",
                  ring.id === selected.id ? "border-ink" : "border-stone",
                )}
              >
                <span
                  className="size-3 rounded-full border border-stone"
                  style={{ backgroundColor: ring.hex }}
                  aria-hidden
                />
                {ring.name}
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-8 divide-y divide-stone border-y border-stone">
          <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-muted">Finish</dt>
            <dd>{selected.finish}</dd>
          </div>
          {ringFacts.map((fact) => (
            <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
              <dt className="text-sm text-muted">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <Button
          className="mt-6 w-full sm:w-auto"
          onClick={() =>
            addItem({
              id: `ring-${selected.id}`,
              name: "Joova Smart Ring",
              price: RING_PRICE,
              color: selected.name,
            })
          }
        >
          Add to cart
        </Button>
        <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
      </div>
    </Container>
    <Section id="finishes" className="scroll-mt-24 bg-stone/40">
      <Container>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
          Finishes
        </p>
        <h2
          className="font-display mt-3 font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Five finishes
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ringVariants.map((ring) => (
            <li key={ring.id}>
              <button
                type="button"
                onClick={() => choose(ring)}
                className={cn(
                  "stage w-full rounded-3xl border p-5 text-left",
                  ring.id === selected.id ? "border-ink" : "border-stone",
                )}
              >
                <Image
                  src={ring.image}
                  alt={`Joova Smart Ring in ${ring.name}, ${ring.finish.toLowerCase()}`}
                  width={ringImageSize.width}
                  height={ringImageSize.height}
                  className="mx-auto h-56 w-auto"
                  sizes="(min-width: 1024px) 320px, 50vw"
                />
                <p className="mt-4 font-display text-2xl font-semibold">{ring.name}</p>
                <p className="text-sm text-muted">{ring.finish}</p>
                <p className="mt-2 text-sm text-muted">{ring.summary}</p>
              </button>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
    <Section>
      <Container className="max-w-3xl">
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          What it tracks
        </h2>
        <p className="mt-4 text-muted">
          Sleep, activity, and heart-rate trends. Wellness insights only. No
          subscription. Ever.
        </p>
      </Container>
    </Section>
    </>
  );
}
