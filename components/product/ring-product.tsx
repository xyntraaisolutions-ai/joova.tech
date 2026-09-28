"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  policies,
  RING_PRICE,
  ringFacts,
  ringImageSize,
  ringPriceLabel,
  ringSizes,
  ringVariants,
  type RingVariant,
} from "@/content/site";
import { useCart } from "@/components/layout/cart-provider";
import { StickyBuyBar } from "@/components/layout/sticky-buy-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const finishes = [
  { id: "silver", name: "Silver" },
  { id: "black", name: "Black" },
  { id: "rose-gold", name: "Rose Gold" },
] as const;

const styles = [
  { id: "classic", name: "Classic", detail: "Smooth" },
  { id: "wave", name: "Wave", detail: "Textured" },
] as const;

export function RingProduct() {
  const [finishId, setFinishId] = useState<(typeof finishes)[number]["id"]>("silver");
  const [styleId, setStyleId] = useState<(typeof styles)[number]["id"]>("classic");
  const [size, setSize] = useState<(typeof ringSizes)[number]>(9);
  const { addItem } = useCart();

  const selected =
    ringVariants.find((ring) => ring.finishId === finishId && ring.styleId === styleId) ??
    ringVariants[0];

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    const match = ringVariants.find((ring) => ring.id === id);
    if (!match) return;
    setFinishId(match.finishId);
    setStyleId(match.styleId);
  }, []);

  const choose = (ring: RingVariant) => {
    setFinishId(ring.finishId);
    setStyleId(ring.styleId);
    window.history.replaceState(null, "", `#${ring.id}`);
  };

  const add = () =>
    addItem({
      id: `ring-${selected.id}-${size}`,
      name: "Joova Ring",
      price: RING_PRICE,
      color: `${selected.finish} ${selected.style}, size ${size}`,
    });

  return (
    <>
      <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <div className="stage rounded-[24px] p-6">
          <Image
            src={selected.image}
            alt={`Joova Ring in ${selected.finish} ${selected.style}`}
            width={ringImageSize.width}
            height={ringImageSize.height}
            priority
            className="mx-auto h-auto w-full max-w-lg"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
            Wearables
          </p>
          <h1 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
            Joova Ring
          </h1>
          <p className="mt-3 font-display text-3xl font-semibold">Smart ring. No subscription.</p>
          <p className="mt-3 text-2xl">{ringPriceLabel}</p>
          <Badge className="mt-4">No subscription needed. Ever.</Badge>
          <p className="mt-6 text-muted">
            A stainless-steel smart ring that tracks sleep, heart rate, and daily
            activity without a screen on your wrist. It syncs to the free Joova app
            and Apple Health. No monthly bill. Ever.
          </p>
          <p className="mt-3 text-muted">{selected.summary}</p>

          <div className="mt-8">
            <p className="text-sm font-medium">Finish</p>
            <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Joova Ring finishes">
              {finishes.map((finish) => {
                const sample = ringVariants.find(
                  (ring) => ring.finishId === finish.id && ring.styleId === styleId,
                );
                return (
                  <button
                    key={finish.id}
                    type="button"
                    role="option"
                    aria-selected={finish.id === finishId}
                    onClick={() => sample && choose(sample)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm",
                      finish.id === finishId ? "border-ink" : "border-stone",
                    )}
                  >
                    <span
                      className="size-3 rounded-full border border-stone"
                      style={{ backgroundColor: sample?.hex }}
                      aria-hidden
                    />
                    {finish.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium">Style</p>
            <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Joova Ring styles">
              {styles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  role="option"
                  aria-selected={style.id === styleId}
                  onClick={() => {
                    const sample = ringVariants.find(
                      (ring) => ring.finishId === finishId && ring.styleId === style.id,
                    );
                    if (sample) choose(sample);
                  }}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm",
                    style.id === styleId ? "border-ink" : "border-stone",
                  )}
                >
                  {style.name}
                  <span className="ml-2 text-muted">{style.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium">Size</p>
            <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Joova Ring sizes">
              {ringSizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === size}
                  onClick={() => setSize(option)}
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-full border text-sm",
                    option === size ? "border-ink" : "border-stone",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              US sizes 7 to 12. The index finger gives the best readings.
            </p>
          </div>

          <Button className="mt-6 w-full sm:w-auto" onClick={add}>
            Add to cart
          </Button>
          <Button
            variant="secondary"
            className="mt-3 w-full sm:ml-3 sm:w-auto"
            onClick={() =>
              addItem({
                id: "ring-sizing-kit",
                name: "Joova Ring sizing kit",
                price: 0,
              })
            }
          >
            Add free sizing kit
          </Button>
          <p className="mt-2 text-sm text-muted">
            Wear the sample for a day, then confirm your size. If it does not fit, the size exchange is free.
          </p>
          <p className="mt-2 text-sm text-muted">{policies.shipping}</p>
        </div>
      </Container>

      <Section id="styles" className="scroll-mt-24 bg-stone/40">
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
            Styles
          </p>
          <h2 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            2 styles, 3 finishes
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
                    alt={`Joova Ring in ${ring.finish} ${ring.style}`}
                    width={ringImageSize.width}
                    height={ringImageSize.height}
                    className="mx-auto h-56 w-auto"
                    sizes="(min-width: 1024px) 320px, 50vw"
                  />
                  <p className="mt-4 font-display text-2xl font-semibold">
                    {ring.finish} {ring.style}
                  </p>
                  <p className="mt-2 text-sm text-muted">{ring.summary}</p>
                </button>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            Specifications
          </h2>
          <dl className="mt-8 divide-y divide-stone border-y border-stone">
            {ringFacts.map((fact) => (
              <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm text-muted">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
      <StickyBuyBar
        label={`Joova Ring, ${selected.finish} ${selected.style}, size ${size}`}
        price={RING_PRICE}
        onBuy={add}
      />
    </>
  );
}
