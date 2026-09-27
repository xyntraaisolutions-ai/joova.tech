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

export function Hero() {
  return (
    <section className="cinematic relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-coral/25 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-10 sm:px-8 md:grid-cols-2 md:gap-10 md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
            Launches {LAUNCH_SHORT} · Pre-order {priceLabel} before {PREORDER_SHORT}
          </p>
          <h1
            className="font-display mt-4 font-extrabold leading-[0.92]"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Health tracking without the monthly bill.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/80">
            A screenless woven band. Five colors. Two straps in every box.
            No subscription. Ever.
          </p>
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
