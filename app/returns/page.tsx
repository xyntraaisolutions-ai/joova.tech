import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";
import { ReturnRequest } from "@/components/returns/return-request";

export async function generateMetadata(): Promise<Metadata> {
  const { policies } = await loadContentBundle();
  return {
    title: "Returns",
    description: policies.returnsSummary,
  };
}

export default async function ReturnsPage() {
  const { policies, support, pageCopy } = await loadContentBundle();
  const returns = pageCopy.returns;
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1 className="font-display mt-3" style={{ fontSize: "var(--text-h1)" }}>
        {policies.returnsTitle}
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p className="text-lg text-ink">{policies.returnsSummary}</p>
        <p>
          {returns.window}
        </p>
        <p>
          {returns.exchange}
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
            <li>{returns.stepReply}</li>
            <li>
              {returns.stepShip}
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
          {returns.notWarranty} See the{" "}
          <Link className="font-medium text-ink underline" href="/warranty">
            warranty policy
          </Link>
          .
        </p>
        <ReturnRequest />
      </div>
    </Container>
  );
}
