import type { Metadata } from "next";
import Link from "next/link";
import { company, priceLabel, ringPriceLabel, sharePriceLabel, siteDescription } from "@/content/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About Joova",
  description: siteDescription,
};

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        About Joova
      </h1>
      <p className="mt-6 text-lg text-muted">
        {siteDescription} The Fitness Band is {priceLabel}, a screenless tracker
        with no monthly fee, five colors, and two straps in every box. The
        Smart Ring is {ringPriceLabel}. Joova Share is {sharePriceLabel}.
      </p>
      <p className="mt-6 text-muted">
        Founder story and team photos will go here when they are ready. We will
        not use stock people as if they were the team.
      </p>
      <p className="mt-8">
        <Link href="/contact" className="font-medium underline">
          Contact support
        </Link>
      </p>
      <p className="mt-8 text-sm text-muted">
        {company.legalName}
        <br />
        Business address: {company.address}
      </p>
    </Container>
  );
}
