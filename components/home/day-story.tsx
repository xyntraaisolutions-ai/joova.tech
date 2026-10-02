"use client";

import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import { bandImageSize } from "@/content/site";
import { PhoneMockup } from "@/components/media/phone-mockup";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function DayStory() {
  const { bandVariants, dayStory } = useSiteContent();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observers = refs.current.map((el, index) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(index);
        },
        { threshold: 0.55 },
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  const night = active >= 2;

  return (
    <section
      className={cn(
        "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        night ? "cinematic" : "stage",
      )}
    >
      <Container className="py-16 sm:py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          A day with Joova
        </p>
        <h2
          className="font-display mt-3 font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          From morning readiness to sleep.
        </h2>
        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          <div className="order-2 space-y-16 lg:order-1 lg:space-y-24">
            {dayStory.map((step, index) => (
              <article
                key={step.id}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                className="max-w-xl"
              >
                <p className="text-sm text-muted">0{index + 1}</p>
                <h3 className="mt-2 font-display text-3xl font-extrabold">
                  {step.title}
                </h3>
                <p className="mt-4 text-muted">{step.copy}</p>
                <p className="mt-3 text-sm">{step.metric}</p>
              </article>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="stage flex justify-center rounded-[24px] p-4">
                <ProductTurntable>
                  <BandPhoto
                    src={bandVariants[active % bandVariants.length].image}
                    alt={`Joova Band in ${bandVariants[active % bandVariants.length].name}`}
                    width={bandImageSize.width}
                    height={bandImageSize.height}
                    className="h-auto max-h-72 w-auto"
                  />
                </ProductTurntable>
              </div>
              <PhoneMockup
                title={dayStory[active].title}
                copy={dayStory[active].copy}
                dark={night}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
