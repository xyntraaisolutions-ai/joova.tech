import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { policies, support } from "@/content/site";

export const metadata: Metadata = {
  title: "Returns",
  description: policies.returnsSummary,
};

export default function ReturnsPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        {policies.returnsTitle}
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p>{policies.returnsSummary}</p>
        <p>
          The 60 days start on the delivery date. The return is free, and we
          cover return shipping in the United States. Refund timing follows
          what is stated at checkout, after we receive the product.
        </p>
        <h2 className="font-display text-2xl font-extrabold text-ink">
          How to start a return
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Email{" "}
            <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
              {support.email}
            </a>{" "}
            or use the{" "}
            <Link className="font-medium text-ink underline" href="/contact">
              contact form
            </Link>
            . Include your order number.
          </li>
          <li>We reply within 6 to 24 hours and send a prepaid US return label.</li>
          <li>Pack the band and send it back. We refund after we receive it, or as stated at checkout.</li>
        </ol>
        <p>
          A warranty repair is not a return. Strap and tracker coverage is on the{" "}
          <Link className="font-medium text-ink underline" href="/warranty">
            warranty page
          </Link>
          . The tracker’s third year starts when you register it in the Joova app.
        </p>
      </div>
    </Container>
  );
}
