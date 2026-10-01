import type { Metadata } from "next";
import Link from "next/link";
import { LastUpdated } from "@/components/content/last-updated";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await loadContentBundle();
  return {
    title: "Terms",
    description: `Terms of sale for ${company.legalName}. Joova products, orders, returns, and warranty.`,
  };
}

export default async function TermsPage() {
  const { company, policies, support, pageCopy } = await loadContentBundle();
  const terms = pageCopy.terms;
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Terms
      </h1>
      <LastUpdated value={terms.updatedOn} />
      <p className="mt-4 text-lg text-muted">
        These terms cover joova.tech and Joova products sold by {company.legalName},{" "}
        {company.address}.
      </p>
      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="font-display text-2xl text-ink">Orders</h2>
          <p className="mt-3">
            {terms.orders}
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">No subscription</h2>
          <p className="mt-3">
            {terms.subscription}
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
            {terms.wellness}
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
