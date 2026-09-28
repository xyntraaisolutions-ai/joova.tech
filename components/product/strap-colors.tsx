"use client";

import { bandVariants, STRAP_PRICE, type BandVariant } from "@/content/site";

function Swatches({
  legend,
  selected,
  onSelect,
}: {
  legend: string;
  selected: BandVariant;
  onSelect: (variant: BandVariant) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {bandVariants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-pressed={variant.id === selected.id}
            aria-label={variant.name}
            onClick={() => onSelect(variant)}
            className="flex items-center gap-2 rounded-full border border-stone bg-white px-3 py-2 text-sm min-h-11 aria-pressed:border-ink"
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
  );
}

export function StrapColorChoices({
  worn,
  onWorn,
}: {
  worn: BandVariant;
  onWorn: (variant: BandVariant) => void;
}) {
  return (
    <div className="space-y-4">
      <Swatches legend="Color" selected={worn} onSelect={onWorn} />
      <p className="text-sm text-muted">
        The box includes this strap plus 1 extra. Black includes blue. Every other color includes black.
      </p>
    </div>
  );
}

export function strapOnlyCartItem(variant: BandVariant, quantity = 1) {
  return {
    id: `strap-${variant.id}`,
    name: "Woven strap",
    price: STRAP_PRICE,
    color: variant.name,
    quantity,
  };
}

export function strapCartItem(worn: BandVariant, extra: BandVariant, quantity = 1) {
  return {
    id: `${worn.id}+${extra.id}`,
    name: "Joova Band",
    price: worn.price,
    color: `Worn ${worn.name} · Extra ${extra.name}`,
    quantity,
  };
}
