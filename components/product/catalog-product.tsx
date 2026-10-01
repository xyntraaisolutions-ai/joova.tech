"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import { pageCopy } from "@/content/page-copy";
import { AddToCart } from "@/components/product/add-to-cart";
import { RequestItemButton } from "@/components/shop/shop-card-actions";
import { Badge } from "@/components/ui/badge";
import type { CatalogImage, CatalogProduct, CatalogVariant } from "@/content/catalog";
import { optionAxes, optionAxisLabel, type OptionAxis, type PurchaseSelection } from "@/lib/content/variants";
import { cn, formatUsd } from "@/lib/utils";

function openOptions(product: CatalogProduct) {
  return (product.variants ?? []).filter((option) => option.available !== false && option.name);
}

function dimension(option: CatalogVariant, axis: OptionAxis) {
  return option[axis]?.trim() ?? "";
}

function picksFrom(option?: CatalogVariant) {
  const picks = {} as Partial<Record<OptionAxis, string>>;
  if (!option) return picks;
  for (const axis of optionAxes) {
    const value = dimension(option, axis);
    if (value) picks[axis] = value;
  }
  return picks;
}

function matches(option: CatalogVariant, picks: Partial<Record<OptionAxis, string>>, axis?: OptionAxis, value?: string) {
  for (const key of optionAxes) {
    const picked = key === axis ? value : picks[key];
    if (!picked) continue;
    const have = dimension(option, key);
    if (have && have !== picked) return false;
  }
  if (axis && value) return dimension(option, axis) === value;
  return true;
}

type GallerySlide = CatalogImage & { variantId?: string };

function gallerySlides(options: CatalogVariant[], lead: CatalogVariant | undefined, shared: CatalogImage[]) {
  const ordered = lead ? [lead, ...options.filter((option) => option.id !== lead.id)] : options;
  const seen = new Set<string>();
  const slides: GallerySlide[] = [];
  for (const option of ordered) {
    for (const picture of option.pictures) {
      if (!picture.src || seen.has(picture.src)) continue;
      seen.add(picture.src);
      slides.push({ ...picture, variantId: option.id });
    }
  }
  for (const picture of shared) {
    if (!picture.src || seen.has(picture.src)) continue;
    seen.add(picture.src);
    slides.push(picture);
  }
  return slides;
}

function axisTitle(options: CatalogVariant[], axis: OptionAxis) {
  return options.find((option) => option.labels?.[axis])?.labels?.[axis] || optionAxisLabel[axis];
}

function valuesFor(options: CatalogVariant[], axis: OptionAxis, picks: Partial<Record<OptionAxis, string>>) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const option of options) {
    const value = dimension(option, axis);
    if (!value || seen.has(value) || !matches(option, picks, axis, value)) continue;
    seen.add(value);
    values.push(value);
  }
  return values;
}

export function CatalogProductView({
  product,
  categoryLabel,
}: {
  product: CatalogProduct;
  categoryLabel: string;
}) {
  const options = openOptions(product);
  const shared = product.sharedPictures ?? (options.length ? [] : product.pictures.filter((picture) => picture.src));
  const [picks, setPicks] = useState(() => picksFrom(options.find((option) => option.id === product.defaultVariantId) ?? options[0]));
  const [pictureIndex, setPictureIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);
  const wellness = /\b(band|ring|watch)\b/i.test(product.name) && !/strap/i.test(product.name);
  const lead = options.find((option) => matches(option, picks)) ?? options[0];
  const named = shared.filter((item) => {
    const alt = item.alt.toLowerCase();
    for (const axis of optionAxes) {
      const picked = picks[axis]?.toLowerCase();
      if (!picked) continue;
      const others = options
        .map((option) => dimension(option, axis).toLowerCase())
        .filter((value) => value && value !== picked);
      if (others.some((value) => alt.includes(value))) return false;
    }
    return true;
  });
  const pictures = gallerySlides(options, lead, named);
  const clips = [...(lead?.videos ?? []), ...(product.videos ?? [])];
  const picture = pictures[pictureIndex] ?? pictures[0] ?? product.image;
  const canBuy = product.price > 0 && !product.unpriced && product.availability !== "out_of_stock";
  const selectionLabels = {} as NonNullable<PurchaseSelection["labels"]>;
  for (const axis of optionAxes) {
    const title = options.find((option) => option.labels?.[axis])?.labels?.[axis];
    if (title) selectionLabels[axis] = title;
  }
  const selection: PurchaseSelection = {
    color: picks.color,
    type: picks.type,
    size: picks.size,
    custom: picks.custom,
    sku: lead?.sku || options.find((option) => matches(option, picks) && option.sku)?.sku || product.sku,
    labels: Object.keys(selectionLabels).length ? selectionLabels : undefined,
  };
  function showPicture(index: number) {
    const slide = pictures[index];
    const option = slide?.variantId ? options.find((item) => item.id === slide.variantId) : undefined;
    if (option && option.id !== lead?.id) {
      const within = option.pictures.findIndex((picture) => picture.src === slide.src);
      setPicks(picksFrom(option));
      setPictureIndex(within < 0 ? 0 : within);
      return;
    }
    setPictureIndex(index);
  }

  function choose(axis: OptionAxis, value: string) {
    setPicks((current) => {
      const next = { ...current, [axis]: value };
      const match = options.find((option) => matches(option, next)) ?? options.find((option) => dimension(option, axis) === value);
      return picksFrom(match);
    });
    setPictureIndex(0);
  }

  function onSwipeStart(event: TouchEvent<HTMLDivElement>) {
    swipeStart.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onSwipeEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start == null || pictures.length < 2) return;
    const delta = (event.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) < 40) return;
    const next = delta < 0 ? pictureIndex + 1 : pictureIndex - 1;
    if (next < 0 || next >= pictures.length) return;
    showPicture(next);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
      <div>
        <div
          className="stage rounded-[24px] p-4 sm:p-8"
          onTouchStart={onSwipeStart}
          onTouchEnd={onSwipeEnd}
        >
          {picture.src ? (
            <Image
              src={picture.src}
              alt={picture.alt || product.name}
              width={picture.width}
              height={picture.height}
              priority
              className="mx-auto h-auto max-h-[min(70vh,720px)] w-full object-contain"
              sizes="(min-width: 1024px) 640px, 100vw"
            />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </div>
        {pictures.length > 1 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1" role="listbox" aria-label={`${product.name} pictures`}>
            {pictures.map((item, index) => {
              const current = item.src === picture.src;
              return (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={current}
                  aria-label={item.alt || `${product.name} picture ${index + 1}`}
                  onClick={() => showPicture(index)}
                  className={cn(
                    "stage w-20 shrink-0 overflow-hidden rounded-2xl border p-1 sm:w-24",
                    current ? "border-ink" : "border-stone",
                  )}
                >
                  <Image
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    className="aspect-square h-auto w-full object-contain"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
        {clips.length ? (
          <div className="mt-4 grid gap-3">
            {clips.map((clip) => (
              <video
                key={clip.src}
                className="aspect-video w-full rounded-3xl bg-stone/40"
                src={clip.src}
                poster={clip.poster || picture.src || undefined}
                controls
                preload="metadata"
                aria-label={clip.title}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div id="buy">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">{categoryLabel}</p>
        <h1 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
          {product.name}
        </h1>
        {product.model ? <p className="mt-2 text-muted">{product.model}</p> : null}
        {product.lead ? <p className="mt-3 text-lg text-muted">{product.lead}</p> : null}
        <p className="mt-4 font-display text-3xl font-semibold">{product.unpriced || product.price <= 0 ? "Price not set" : product.priceLabel}</p>
        {product.compareAtLabel || product.compareAt ? <p className="mt-1 text-muted line-through">{product.compareAtLabel ?? formatUsd(product.compareAt ?? 0)}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge>{product.availability === "out_of_stock" ? "Out of stock" : product.status}</Badge>
          {product.availability === "out_of_stock" ? <RequestItemButton product={product} size="sm" /> : null}
        </div>
        {typeof product.availableCount === "number" ? <p className="mt-2 text-sm text-muted">{product.availableCount} available</p> : null}
        {product.summary ? <p className="mt-6 text-muted">{product.summary}</p> : null}
        {wellness ? <p className="mt-4 text-sm text-muted">{pageCopy.terms.wellness}</p> : null}
        {optionAxes.map((axis) => {
          const choices = valuesFor(options, axis, picks);
          if (choices.length === 0) return null;
          const current = picks[axis] ?? choices[0];
          return (
            <div key={axis} className="mt-6">
              <p className="text-sm font-medium" id={`${product.id}-${axis}-label`}>{axisTitle(options, axis)}</p>
              <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-labelledby={`${product.id}-${axis}-label`}>
                {choices.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="option"
                    aria-selected={value === current}
                    onClick={() => choose(axis, value)}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm",
                      value === current ? "border-ink bg-white" : "border-stone",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {canBuy ? (
          <AddToCart
            key={Object.values(picks).join("-") || product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            sku={product.sku}
            selection={selection}
            warrantyNote={product.warrantyNote}
            coverage={product.coverage}
            availableCount={product.availableCount}
          />
        ) : product.availability === "out_of_stock" ? null : (
          <p className="mt-6 text-muted">Price not set.</p>
        )}
      </div>
    </div>
  );
}
