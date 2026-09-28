"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { featuredProducts } from "@/content/catalog";
import { policies } from "@/content/site";
import { ImageSlideshow } from "@/components/media/image-slideshow";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const highlights = featuredProducts;

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);
  const highlight = highlights[active] ?? highlights[0];

  const show = (index: number) => {
    setActive((index + highlights.length) % highlights.length);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || highlights.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % highlights.length);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [paused]);

  if (!highlight) return null;

  return (
    <section
      className="cinematic relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Highlight products"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (dragX.current == null) return;
        const delta = event.clientX - dragX.current;
        dragX.current = null;
        if (Math.abs(delta) < 48) return;
        setPaused(true);
        show(active + (delta < 0 ? 1 : -1));
      }}
      onPointerCancel={() => {
        dragX.current = null;
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--joova-coral)_28%,transparent),transparent_55%)]"
      />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-5 py-6 sm:px-8 md:grid-cols-2 md:gap-12 md:py-16">
        <div className="stage min-w-0 rounded-[28px] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 md:order-2">
          <ImageSlideshow
            key={highlight.id}
            slides={[...highlight.pictures]}
            priority={highlight.id === "band"}
            paused={paused}
            imageClassName="h-[min(28vh,240px)] w-auto md:h-[min(52vh,480px)]"
          />
        </div>
        <div className="min-w-0 md:order-1">
          {highlight.kicker ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              {highlight.kicker}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-display max-w-xl font-semibold leading-[1.05]",
              highlight.kicker && "mt-3",
            )}
            style={{ fontSize: "var(--text-h1)" }}
          >
            <span className="sr-only">Featured. </span>
            {highlight.name}
          </h1>
          <p className="mt-3 font-display text-3xl font-semibold text-paper">{highlight.priceLabel}</p>
          <p className="mt-4 max-w-xl text-lg text-paper/85">{highlight.lead}</p>
          <p className="mt-3 hidden max-w-xl text-paper/75 md:block">{highlight.detail}</p>
          <div
            className="mt-4 flex gap-2"
            role="tablist"
            aria-label="Highlight products"
          >
            {highlights.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => show(index)}
                className={cn(
                  "min-h-11 flex-1 rounded-full px-3 text-sm font-medium sm:flex-none sm:px-4",
                  index === active ? "bg-paper text-ink" : "text-paper/80 ring-1 ring-paper/25",
                )}
              >
                {item.menuLabel}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Link href={highlight.href} className={buttonClassName("primary", "lg", "w-full sm:w-auto")}>
              See Details
            </Link>
          </div>
          <div className="mt-4 -mx-5 flex max-w-full gap-2 overflow-x-auto px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
            {highlight.signals.map((signal) => (
              <div
                key={signal.label}
                className="min-w-[9.5rem] snap-start rounded-2xl border border-paper/15 bg-paper/10 px-3 py-3 text-paper md:min-w-0"
              >
                <p className="text-sm font-semibold">{signal.label}</p>
                <p className="text-xs text-paper/70">{signal.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-paper/70">
              {highlight.note ? `${highlight.note} · ` : null}
              {policies.shipping}
            </p>
            <div className="hidden shrink-0 gap-2 md:flex">
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full border border-paper/30 text-paper"
                aria-label="Previous product"
                onClick={() => show(active - 1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full border border-paper/30 text-paper"
                aria-label="Next product"
                onClick={() => show(active + 1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
