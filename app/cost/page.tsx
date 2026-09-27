import type { Metadata } from "next";
import { MarginModel } from "@/components/planning/margin-model";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cost",
  description:
    "Joova Band cost and net profit for 1,000 bands and 1,500 additional straps, with quantity and price you can change.",
};

export default function CostPage() {
  return (
    <Container className="py-10 md:py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-coral-ink uppercase">
        Cost
      </p>
      <h1
        className="font-display mt-3 max-w-3xl font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        What you keep.
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-muted">
        Each band costs $10 to manufacture. Each additional strap costs $1. The
        first view is 1,000 bands and 1,500 additional straps, sold at $49.99.
        Freight to the Texas warehouse, customs, tariff, customer shipping,
        platform fees, and ads are planning assumptions you can edit. Confirm
        each quote before you rely on the net profit.
      </p>
      <div className="mt-10">
        <MarginModel />
      </div>
    </Container>
  );
}
