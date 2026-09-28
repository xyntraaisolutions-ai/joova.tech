import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
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
      <h1 className="font-display mt-3" style={{ fontSize: "var(--text-h1)" }}>
        {policies.returnsTitle}
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p className="text-lg text-ink">{policies.returnsSummary}</p>
        <p>
          The 30 days start on the delivery date and apply to Joova orders in
          the United States. We cover return shipping. After day 30, the free
          return window is closed.
        </p>
        <p>
          A Joova Ring size exchange is included in those same 30 days. Wear
          the free sizing sample, then confirm the size before the ring ships.
          If the ring still does not fit, request the exchange inside the 30
          days.
        </p>
        <section>
          <h2 className="font-display text-2xl text-ink">How to start a return</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Sign in to your{" "}
              <Link className="font-medium text-ink underline" href="/account">
                Joova Customer Account
              </Link>{" "}
              and start the return from your purchase history. You can also
              email{" "}
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
            <li>
              Pack the product and send it back. We refund after we receive it,
              or as stated at checkout. You can follow the return from the
              account.
            </li>
          </ol>
          <Link href="/account" className={`${buttonClassName("primary")} mt-6 w-full sm:w-fit`}>
            Open your Joova Customer Account
          </Link>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">What the account is for</h2>
          <p className="mt-3">{policies.accountSummary}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Purchase history</li>
            <li>Order tracking</li>
            <li>Returns</li>
            <li>Replacements</li>
          </ul>
        </section>
        <p>
          A warranty claim is not a return. Warranty coverage starts only after
          you register the product in your Joova Customer Account. See the{" "}
          <Link className="font-medium text-ink underline" href="/warranty">
            warranty policy
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
