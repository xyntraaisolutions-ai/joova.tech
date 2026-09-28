"use client";

import Image from "next/image";
import { useState } from "react";
import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import {
  bandVariants,
  boxBack,
  boxImageSize,
  boxFacts,
  inTheBox,
  unboxingImage,
  type BandVariant,
} from "@/content/site";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function BoxDesign() {
  const [selected, setSelected] = useState<BandVariant>(bandVariants[0]);

  return (
    <Section id="box" className="scroll-mt-24 bg-stone/40">
      <Container>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
          The box
        </p>
        <h2
          className="font-display mt-3 max-w-3xl font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          The box is the color of the band inside.
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          A rigid two-piece box, about 12 × 16 × 5 cm. Soft-touch matte, with a
          gloss spot on the logo. Front, side, and back are the same design in
          every color.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {bandVariants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              aria-pressed={variant.id === selected.id}
              onClick={() => setSelected(variant)}
              className="rounded-full border border-stone bg-white px-4 py-2 text-sm aria-pressed:border-ink"
            >
              {variant.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <figure className="stage overflow-hidden rounded-[24px]">
            <div className="px-6 pt-6">
              <ProductTurntable>
                <BandPhoto
                  src={selected.box}
                  mark="box"
                  alt={`${selected.name} Joova Band box, front`}
                  width={boxImageSize.width}
                  height={boxImageSize.height}
                  className="h-auto w-full"
                  sizes="(min-width: 1024px) 600px, 100vw"
                />
              </ProductTurntable>
            </div>
            <figcaption className="px-6 pb-6 text-sm text-muted">
              Front · {selected.name} · box {selected.boxHex}
            </figcaption>
          </figure>
          <figure className="stage overflow-hidden rounded-[24px]">
            <div className="px-6 pt-6">
              <ProductTurntable>
                <Image
                  src={boxBack}
                  alt="Joova Band box back, the same on every color"
                  width={748}
                  height={868}
                  className="h-auto w-full"
                  sizes="(min-width: 1024px) 600px, 100vw"
                  unoptimized
                />
              </ProductTurntable>
            </div>
            <figcaption className="px-6 pb-6 text-sm text-muted">
              Back · same on every color · English and French
            </figcaption>
          </figure>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxFacts.map((fact) => (
            <div key={fact.label} className="rounded-3xl bg-white p-5">
              <p className="text-sm text-muted">{fact.label}</p>
              <p className="mt-2 font-medium">{fact.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h3 className="font-display text-3xl font-bold">What you open</h3>
            <p className="mt-3 text-muted">
              Lift the lid: the tracker and two straps in a molded paper tray.
              Cable and cards sit in the drawer underneath.
            </p>
            <ul className="mt-6 space-y-3">
              {inTheBox.map((item) => (
                <li key={item} className="rounded-2xl bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Image
            src={unboxingImage}
            alt="Joova unboxing: lid message, paper tray with two straps, and the cards inside"
            width={2560}
            height={2160}
            className="h-auto w-full rounded-[24px]"
            sizes="(min-width: 1024px) 640px, 100vw"
          />
        </div>
      </Container>
    </Section>
  );
}
