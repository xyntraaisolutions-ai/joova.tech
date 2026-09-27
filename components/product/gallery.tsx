"use client";

import { BandPhoto } from "@/components/media/band-photo";
import { cn } from "@/lib/utils";
import type { BandVariant } from "@/content/site";

export function Gallery({
  variants,
  selected,
  onSelect,
}: {
  variants: readonly BandVariant[];
  selected: BandVariant;
  onSelect: (variant: BandVariant) => void;
}) {
  return (
    <div>
      <div className="stage flex justify-center rounded-[24px] p-6">
        <BandPhoto
          src={selected.image}
          alt={`Joova Band in ${selected.name}`}
          width={520}
          height={750}
          priority
          className="h-auto max-h-[640px] w-auto"
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </div>
      <div className="mt-4 flex gap-3 overflow-auto">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant)}
            className={cn(
              "stage w-24 shrink-0 overflow-hidden rounded-2xl border p-1",
              variant.id === selected.id ? "border-ink" : "border-stone",
            )}
            aria-label={variant.name}
            aria-pressed={variant.id === selected.id}
          >
            <BandPhoto
              src={variant.image}
              alt=""
              width={520}
              height={750}
              loading="eager"
              className="pointer-events-none h-auto w-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        className="size-10 rounded-full border border-stone"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span>{value}</span>
      <button
        className="size-10 rounded-full border border-stone"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
