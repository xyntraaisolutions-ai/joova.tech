"use client";

import { BandPhoto } from "@/components/media/band-photo";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export function ImageSlideshow({
  slides,
  className,
  imageClassName,
  priority = false,
  intervalMs = 4200,
}: {
  slides: readonly Slide[];
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAuto(!reduce);
  }, []);

  useEffect(() => {
    if (!auto || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [auto, intervalMs, slides.length]);

  const slide = slides[index];

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setAuto(!reduce);
      }}
    >
      <div className="flex justify-center">
        <BandPhoto
          src={slide.src}
          alt={slide.alt}
          width={slide.width}
          height={slide.height}
          priority={priority && index === 0}
          className={imageClassName ?? "h-auto w-full"}
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </div>
      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2" role="tablist" aria-label="Slides">
            {slides.map((item, i) => (
              <button
                key={item.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={item.alt}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2.5 rounded-full transition",
                  i === index ? "w-8 bg-ink" : "w-2.5 bg-stone",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-stone bg-white"
              aria-label="Previous image"
              onClick={() =>
                setIndex((current) => (current - 1 + slides.length) % slides.length)
              }
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-stone bg-white"
              aria-label="Next image"
              onClick={() => setIndex((current) => (current + 1) % slides.length)}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
