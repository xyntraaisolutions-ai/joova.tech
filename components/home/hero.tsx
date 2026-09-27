"use client";

import Link from "next/link";
import { bandImageSize, bandVariants, LAUNCH_SHORT, policies, PREORDER_SHORT, priceLabel } from "@/content/site";
import { ImageSlideshow } from "@/components/media/image-slideshow";
import { buttonClassName } from "@/components/ui/button";

const slides = bandVariants.map((variant) => ({
  src: variant.image,
  alt: `Joova Band in ${variant.name}, woven strap with a black tracker and silver buckle`,
  width: bandImageSize.width,
  height: bandImageSize.height,
}));

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
  return (
    <section className="cinematic relative overflow-hidden">
      <HealthField />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-10 sm:px-8 md:grid-cols-2 md:gap-10 md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
            Launches {LAUNCH_SHORT} · Pre-order {priceLabel} before {PREORDER_SHORT}
          </p>
          <h1
            className="font-display mt-4 max-w-xl font-semibold leading-[1.02]"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Health tracking without the monthly bill.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/80">
            A screenless woven band. Five colors. Two straps in every box.
            No subscription. Ever.
          </p>
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/band" className={buttonClassName("primary", "lg", "w-full sm:w-auto")}>
              Pre-order now
            </Link>
            <a
              href="#colors"
              className={buttonClassName("secondary", "lg", "w-full border-paper/30 text-paper sm:w-auto")}
            >
              See the colors
            </a>
          </div>
          <p className="mt-8 text-sm text-paper/70">{policies.heroLine}</p>
          <p className="mt-2 text-sm text-paper/70">{policies.shipping}</p>
        </div>
        <div className="stage rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-10">
          <ImageSlideshow
            slides={slides}
            priority
            imageClassName="h-[min(52vh,480px)] w-auto"
          />
        </div>
      </div>
    </section>
  );
}
