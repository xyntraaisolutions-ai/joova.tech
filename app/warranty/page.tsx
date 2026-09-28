import type { Metadata } from "next";
import Link from "next/link";
import { WarrantyForm } from "@/components/warranty/warranty-form";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { policies, support } from "@/content/site";

export const metadata: Metadata = {
  title: "Warranty",
  description: policies.warrantyRegistration,
};

export default function WarrantyPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1 className="font-display mt-3" style={{ fontSize: "var(--text-h1)" }}>
        Warranty
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p className="text-lg text-ink">{policies.warrantyRegistration}</p>
        <p>
          A product that is not registered is not covered. Returns are separate,
          and the only free return window is {policies.returnsTitle.toLowerCase()}{" "}
          in the United States.
        </p>
        <section>
          <h2 className="font-display text-2xl text-ink">How to register</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Sign up for a Joova Customer Account.</li>
            <li>Open the account and register each eligible product, with the order number.</li>
            <li>Coverage starts on the day the product is registered.</li>
          </ol>
          <Link href="/account" className={`${buttonClassName("primary")} mt-6 w-full sm:w-fit`}>
            Create a Joova Customer Account
          </Link>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">What the account includes</h2>
          <p className="mt-3">{policies.accountSummary}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Purchase history for every Joova order on the account.</li>
            <li>Order tracking.</li>
            <li>Returns and replacements, started and followed from the same account.</li>
            <li>Warranty registration for each eligible product.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Coverage after registration</h2>
          <p className="mt-3">{policies.strapSummary}</p>
          <p className="mt-3">{policies.dockSummary}</p>
          <p className="mt-3">
            Joova Ring is covered for 2 years after registration. Joova Watch,
            Joova Glasses, Joova Buds, and Joova Share Pod are covered for 1
            year after registration.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">How a claim works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>The product must already be registered on your Joova Customer Account.</li>
            <li>Submit the warranty form with your order number and what failed, or start the replacement from the account.</li>
            <li>We confirm coverage and reply within 6 to 24 hours.</li>
            <li>When a replacement is due, we ship it first, then you send the original back.</li>
          </ol>
          <p className="mt-3">
            You can also email{" "}
            <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
              {support.email}
            </a>
            . On a covered claim inside the United States, Joova pays the
            replacement shipping. Misuse, water beyond the stated rating, and
            unauthorized repair are not covered. Lawyer review is still pending.
          </p>
          <p className="mt-3">
            The free return window is 30 days from delivery, and only in the
            United States. See the{" "}
            <Link className="font-medium text-ink underline" href="/returns">
              returns policy
            </Link>
            .
          </p>
        </section>
        <WarrantyForm />
      </div>
    </Container>
  );
}
