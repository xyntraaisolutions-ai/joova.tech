"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  bandImageSize,
  bandVariants,
  policies,
  priceLabel,
  ringPriceLabel,
  ringImageSize,
  ringVariants,
} from "@/content/site";
import { ImageSlideshow, type Slide } from "@/components/media/image-slideshow";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Highlight = {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  detail: string;
  href: string;
  price: string;
  note: string;
  pictures: Slide[];
};

const highlights: Highlight[] = [
  {
    id: "band",
    kicker: "",
    title: "Faceless Fitness Tracker Band",
    lead: "Health tracking without the monthly bill.",
    detail: "A screenless woven band. Five colors. Two straps in every box. No subscription. Ever.",
    href: "/band",
    price: priceLabel,
    note: policies.heroLine,
    pictures: bandVariants.map((variant) => ({
      src: variant.image,
      alt: `Joova Band in ${variant.name}, woven strap with a black tracker and silver buckle`,
      width: bandImageSize.width,
      height: bandImageSize.height,
    })),
  },
  {
    id: "ring",
    kicker: "Smart Ring",
    title: "Smart Ring",
    lead: "Five finishes on one screenless ring.",
    detail:
      "Midnight, Silver, Gold, Rose, and Graphite. Sleep, activity, and heart-rate trends. No subscription. Ever.",
    href: "/ring",
    price: ringPriceLabel,
    note: "",
    pictures: ringVariants.map((ring) => ({
      src: ring.image,
      alt: `Joova Smart Ring in ${ring.name}, ${ring.finish.toLowerCase()}`,
      width: ringImageSize.width,
      height: ringImageSize.height,
    })),
  },
];

const signals = [
  { label: "Sleep", text: "Overnight trends" },
  { label: "Heart", text: "Rate and recovery" },
  { label: "Activity", text: "Movement all day" },
] as const;

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M16 4a7 7 0 1 0 4 12.6A8 8 0 1 1 16 4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M3 12h4l2-5 4 10 2-5h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const signalIcons = [SleepIcon, HeartIcon, ActivityIcon];

function HealthField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute -left-10 top-20 hidden size-44 text-coral/30 sm:block" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 54S10 40 10 24a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 16-22 30-22 30z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg className="absolute right-[8%] top-10 hidden size-28 text-paper/25 md:block" viewBox="0 0 64 64" fill="none">
        <path d="M40 8a18 18 0 1 0 10 32.4A20 20 0 1 1 40 8z" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute inset-x-0 bottom-0 h-28 w-full text-paper/20" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
        <path
          d="M0 70h180l40-36 50 72 36-36h120l28-48 44 84 32-36h570"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute -right-16 top-24 size-72 rounded-full bg-coral/20 blur-3xl" />
    </div>
  );
}

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
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
    >
      <HealthField />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-10 sm:px-8 md:grid-cols-2 md:gap-10 md:py-20">
        <div>
          {highlight.kicker ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              {highlight.kicker}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-display max-w-xl font-semibold leading-[1.02]",
              highlight.kicker && "mt-4",
            )}
            style={{ fontSize: "var(--text-h1)" }}
          >
            {highlight.title}
          </h1>
          <p className="mt-4 font-display text-3xl font-semibold text-paper">{highlight.price}</p>
          <p className="mt-6 max-w-xl text-lg text-paper/80">{highlight.lead}</p>
          <p className="mt-4 max-w-xl text-paper">{highlight.detail}</p>
          <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
            {signals.map((signal, index) => {
              const Icon = signalIcons[index];
              return (
                <li
                  key={signal.label}
                  className="rounded-2xl border border-paper/15 bg-paper/5 px-3 py-3 text-paper"
                >
                  <Icon />
                  <p className="mt-2 text-sm font-semibold">{signal.label}</p>
                  <p className="text-xs text-paper/70">{signal.text}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-8">
            <Link href={highlight.href} className={buttonClassName("primary", "lg", "w-full sm:w-auto")}>
              See Details
            </Link>
          </div>
          <div className="mt-8">
            {highlight.note ? <p className="text-sm text-paper/70">{highlight.note}</p> : null}
            <p className={cn("text-sm text-paper/70", highlight.note && "mt-2")}>{policies.shipping}</p>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Highlight products">
              {highlights.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  onClick={() => show(index)}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm font-medium",
                    index === active ? "bg-paper text-ink" : "text-paper/80 hover:text-paper",
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full border border-paper/30 text-paper"
                aria-label="Previous product"
                onClick={() => show(active - 1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full border border-paper/30 text-paper"
                aria-label="Next product"
                onClick={() => show(active + 1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="stage rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-10">
          <ImageSlideshow
            key={highlight.id}
            slides={highlight.pictures}
            priority={highlight.id === "band"}
            paused={paused}
            imageClassName="h-[min(52vh,480px)] w-auto"
          />
        </div>
      </div>
    </section>
  );
}
