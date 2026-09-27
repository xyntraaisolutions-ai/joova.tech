import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import {
  colorMix,
  launchSteps,
  marketNote,
  markets,
  orderPlan,
  planBudget,
  planDate,
  planSummary,
  thisWeek,
} from "@/content/planning";

export const metadata: Metadata = {
  title: "Planning",
  description:
    "Joova Band launch plan from signing through first sales on Nov 18, 2026, then Canada in January 2027.",
};

const marketFields = [
  ["When", "when"],
  ["Where to sell", "where"],
  ["Stock", "stock"],
  ["Radio certification", "radio"],
  ["Box and labels", "labels"],
  ["Sales tax", "tax"],
] as const;

export default function PlanningPage() {
  return (
    <Container className="py-10 md:py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-coral-ink uppercase">
        Launch plan · {planDate}
      </p>
      <h1
        className="font-display mt-3 max-w-3xl font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        From signing to first sales.
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-muted">{planSummary}</p>

      <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["On sale", "Nov 18"],
          ["Order", orderPlan.units],
          ["Price", orderPlan.price],
          ["Promise", orderPlan.promise],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-2 font-display text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-14" aria-labelledby="order-heading">
        <h2 id="order-heading" className="font-display text-3xl font-semibold">
          The order
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          {orderPlan.units} at {orderPlan.price}, in five colors. {orderPlan.straps}.{" "}
          {orderPlan.front}.
        </p>
        <ul className="mt-6 grid gap-3">
          {colorMix.map((color) => (
            <li key={color.name} className="rounded-3xl bg-white p-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium">{color.name}</p>
                <p className="text-sm text-muted">
                  {color.qty.toLocaleString("en-US")} · {color.share}
                </p>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-stone"
                role="presentation"
              >
                <div className="h-full rounded-full bg-ink" style={{ width: color.share }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8">
        <Link href="/cost" className="font-medium text-coral-ink underline">
          Open the cost and net profit page
        </Link>
      </p>

      <section className="mt-16" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="font-display text-3xl font-semibold">
          11 steps to launch
        </h2>
        <ol className="mt-6 grid gap-3">
          {launchSteps.map((step) => (
            <li key={step.n} className="rounded-3xl bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-display text-xl font-semibold">
                  <span className="mr-2 text-coral-ink">{step.n}</span>
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-muted">{step.when}</p>
              </div>
              <p className="mt-3 max-w-3xl text-muted">{step.copy}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-3xl bg-stone px-5 py-4 text-sm text-muted">
          Budget: {planBudget}
        </p>
      </section>

      <section className="mt-16" aria-labelledby="markets-heading">
        <h2 id="markets-heading" className="font-display text-3xl font-semibold">
          Selling in the US and Canada
        </h2>
        <p className="mt-3 max-w-3xl text-muted">{marketNote}</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {markets.map((market) => (
            <article key={market.name} className="rounded-3xl bg-white p-5 sm:p-6">
              <h3 className="font-display text-2xl font-semibold">{market.name}</h3>
              <dl className="mt-4 space-y-4">
                {marketFields.map(([label, key]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium">{label}</dt>
                    <dd className="mt-1 text-muted">{market[key]}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="week-heading">
        <h2 id="week-heading" className="font-display text-3xl font-semibold">
          This week
        </h2>
        <ul className="mt-6 grid gap-3">
          {thisWeek.map((item) => (
            <li
              key={item}
              className="flex gap-4 rounded-3xl bg-white p-5 text-muted"
            >
              <span
                className="mt-0.5 size-5 shrink-0 rounded-md border border-stone"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
