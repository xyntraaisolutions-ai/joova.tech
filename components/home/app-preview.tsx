"use client";

import { useEffect, useState } from "react";
import { appScreens } from "@/content/site";
import { PhoneMockup } from "@/components/media/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function AppPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % appScreens.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const screen = appScreens[index];

  return (
    <Section className="bg-stone/30">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            The Joova app is free. Always.
          </h2>
          <p className="mt-4 text-muted">
            Sleep, activity, heart-rate trends, and recovery — without a
            monthly plan. Works with Apple Health and Google Health Connect.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>App Store (link after approval)</Badge>
            <Badge>Google Play (link after approval)</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {appScreens.map((item, i) => (
              <button
                key={item.id}
                className="inline-flex min-h-11 items-center rounded-full border border-stone px-4 text-sm aria-pressed:border-ink"
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <PhoneMockup title={screen.title} copy={screen.copy} />
      </Container>
    </Section>
  );
}
