import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { company, policies, support } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of sale for ${company.legalName}. Joova products, orders, returns, and warranty.`,
};

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display" style={{ fontSize: "var(--text-h1)" }}>
        Terms
      </h1>
      <p className="mt-4 text-lg text-muted">
        These terms cover joova.tech and Joova products sold by {company.legalName},{" "}
        {company.address}.
      </p>
      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="font-display text-2xl text-ink">Orders</h2>
          <p className="mt-3">
            The price is the price shown on the product page. What you see is
            what you pay. Orders ship from US warehouses and are delivered in 7
            to 10 days. Shipping is free in the United States.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">No subscription</h2>
          <p className="mt-3">
            When a Joova product includes features in the Joova app, those
            features come with the product. No subscription needed. Ever. We do
            not charge a monthly fee for features included with the product you
            buy.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Returns</h2>
          <p className="mt-3">
            {policies.returnsSummary}{" "}
            <Link className="font-medium text-ink underline" href="/returns">
              Read the returns policy
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Warranty</h2>
          <p className="mt-3">
            {policies.warrantyRegistration} Coverage for each product is on the{" "}
            <Link className="font-medium text-ink underline" href="/warranty">
              warranty page
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Wellness</h2>
          <p className="mt-3">
            Joova products are consumer technology. Where a product shows a
            wellness reading, that reading is for general wellness only. Joova
            does not diagnose, treat, or detect disease.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Questions</h2>
          <p className="mt-3">
            Email{" "}
            <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
              {support.email}
            </a>
            . {company.supportHours}
          </p>
        </section>
      </div>
    </Container>
  );
}
