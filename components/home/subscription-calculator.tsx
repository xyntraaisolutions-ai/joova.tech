"use client";

import { useMemo, useState } from "react";
import { calculatorDefaultMonthly, PRICE, RING_PRICE } from "@/content/site";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { formatUsd } from "@/lib/utils";

export function SubscriptionCalculator() {
  const [years, setYears] = useState(3);
  const [monthly, setMonthly] = useState(calculatorDefaultMonthly);

  const subTotal = useMemo(() => monthly * 12 * years, [monthly, years]);

  return (
    <Section id="calculator">
      <Container>
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          No subscription needed. Ever.
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          The Fitness Band is {formatUsd(PRICE)} once. The Smart Ring is{" "}
          {formatUsd(RING_PRICE)} once. Neither needs a subscription. The monthly
          figure starts at $10, a common price for a tracker app subscription.
          Edit it. Joova does not charge it.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-muted">Years of use: {years}</span>
            <input
              type="range"
              min={1}
              max={5}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--joova-coral)]"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">
              Example monthly subscription ($)
            </span>
            <Input
              className="mt-3"
              type="number"
              min={1}
              step={1}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="cinematic rounded-3xl p-6">
            <p className="text-sm text-paper/70">One-time price</p>
            <p className="font-display mt-2 text-3xl">Band {formatUsd(PRICE)}</p>
            <p className="font-display mt-2 text-3xl">Ring {formatUsd(RING_PRICE)}</p>
            <p className="mt-2 text-sm text-paper/70">No subscription needed. Ever.</p>
          </div>
          <div className="rounded-3xl border border-stone p-6">
            <p className="text-sm text-muted">A typical $X/month example</p>
            <p className="font-display mt-2 text-4xl">{formatUsd(subTotal)}</p>
            <p className="mt-2 text-sm text-muted">
              {formatUsd(monthly)} × 12 × {years} years
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
