import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Returns",
  description: "60-day free returns on Joova Band.",
};

export default function ReturnsPage() {
  return (
    <Container className="max-w-3xl py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        60-day returns
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p>
          You have 60 days from delivery to start a return. We cover return
          shipping in the US for the band.
        </p>
        <h2 className="font-display text-2xl font-extrabold text-ink">
          How to start a return
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Email hello@joova.tech or use the contact form.</li>
          <li>We send a prepaid label (Shopify returns later).</li>
          <li>Refund after we receive the band, or as stated at checkout.</li>
        </ol>
      </div>
    </Container>
  );
}
