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
          Joova Band is sold as a one-time purchase. Every feature in the Joova
          app is free. We will never charge a monthly fee for features you
          bought with your band.
        </p>
        <p>
          Pre-orders ship November 18, 2026. Wellness claims only. Joova is not
          a medical device and does not diagnose, treat, or detect disease.
        </p>
      </div>
    </Container>
  );
}
