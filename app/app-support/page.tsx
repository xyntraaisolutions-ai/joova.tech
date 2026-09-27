import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { appOptions } from "@/content/app-support";

export const metadata: Metadata = {
  title: "App Support",
  description:
    "Joova launches with a white-label app, then moves to its own app on the factory SDK so the tech team can add features.",
};

export default function AppSupportPage() {
  return (
    <Container className="py-10 md:py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-coral-ink uppercase">
        App Support
      </p>
      <h1
        className="font-display mt-3 max-w-3xl font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        The mobile app, in three steps.
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-muted">
        The band needs an app, and screenless-band factories already have one.
        Joova launches with the white-label app for Phases 1 and 2. In Phase 3
        the tech team builds Joova&apos;s own app on the factory SDK, and adds
        features on top of it. That step needs SDK and code rights in the
        contract.
      </p>
      <p className="mt-4 max-w-3xl text-muted">
        Cost for each option: refer to the manufacturer.
      </p>

      <ol className="mt-10 grid gap-4">
        {appOptions.map((option) => (
          <li key={option.id} className="rounded-3xl bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 className="font-display text-2xl font-semibold">
                <span className="mr-2 text-coral-ink">{option.id}</span>
                {option.title}
              </h2>
              <p
                className={
                  option.launch
                    ? "text-sm font-medium text-coral-ink"
                    : "text-sm font-medium text-muted"
                }
              >
                {option.phase}
              </p>
            </div>
            <p className="mt-4 max-w-3xl text-muted">{option.summary}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium">Time</dt>
                <dd className="mt-1 text-muted">{option.time}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Works well</dt>
                <dd className="mt-1 text-muted">{option.good}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Limit</dt>
                <dd className="mt-1 text-muted">{option.bad}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </Container>
  );
}
