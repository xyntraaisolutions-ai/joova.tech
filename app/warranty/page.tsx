import type { Metadata } from "next";
import Link from "next/link";
import { WarrantyForm } from "@/components/warranty/warranty-form";
import { Container } from "@/components/ui/container";
import { policies, support } from "@/content/site";

export const metadata: Metadata = {
  title: "Warranty",
  description: `${policies.strapSummary} ${policies.dockSummary}`,
};

export default function WarrantyPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Warranty
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">Straps</h2>
          <p className="mt-3">{policies.strapSummary}</p>
          <p className="mt-3">
            This covers the woven straps that ship in the box. It covers
            manufacturing defects for 5 years from delivery.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">Dock</h2>
          <p className="mt-3">{policies.dockSummary}</p>
          <p className="mt-3">
            The dock is the black tracker that sits in the strap. Filling in
            the warranty form is how that coverage is applied. Until we receive
            the form, the dock warranty is not in effect. The free third year
            is part of that same registration.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">
            How a claim works
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Submit the warranty form with your order number and what failed.</li>
            <li>We confirm coverage and reply within 6 to 24 hours.</li>
            <li>When a replacement is due, we ship it first, then you send the original back.</li>
          </ol>
          <p className="mt-3">
            You can also email{" "}
            <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
              {support.email}
            </a>
            . Who pays shipping on a claim, and what is excluded, will be
            finalized after legal review. [CONFIRM]
          </p>
          <p className="mt-3">
            Returns are separate. See the{" "}
            <Link className="font-medium text-ink underline" href="/returns">
              30-day free returns
            </Link>{" "}
            policy.
          </p>
        </section>
        <WarrantyForm />
      </div>
    </Container>
  );
}
