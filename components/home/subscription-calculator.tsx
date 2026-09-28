"use client";

import { useMemo, useState } from "react";
import { calculatorDefaultMonthly, PRICE } from "@/content/site";
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
          No subscription. Do the math.
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Joova is {formatUsd(PRICE)} once. The monthly figure is an example you
          can edit. [CONFIRM: example monthly price]. It is labeled as an
          example, not a competitor quote.
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
            <p className="text-sm text-paper/70">Joova</p>
            <p className="font-display mt-2 text-4xl">{formatUsd(PRICE)}</p>
            <p className="mt-2 text-sm text-paper/70">Total, any number of years</p>
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
