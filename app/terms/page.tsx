import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms",
  description: "Joova terms of sale and the no-subscription promise.",
};

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Draft. Lawyer review required before launch.</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Terms
      </h1>
      <div className="mt-8 space-y-4 text-muted">
        <p>
          The Fitness Band, the Smart Ring, Joova Glasses, and Joova Watch are
          sold as one-time purchases. No subscription needed. Ever. Every
          feature in the Joova app that comes with those products is included.
          We will never charge a monthly fee for features you bought with them.
        </p>
        <p>
          Every Joova product is available now and ships from US warehouses in 7
          to 10 days. Wellness claims only. Joova is not
          a medical device and does not diagnose, treat, or detect disease.
        </p>
      </div>
    </Container>
  );
}
