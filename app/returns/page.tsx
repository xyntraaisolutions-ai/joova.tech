import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LastUpdated } from "@/components/content/last-updated";
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
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        {policies.returnsTitle}
      </h1>
      <LastUpdated value={returns.updatedOn} />
      <div className="mt-8 space-y-6 text-muted">
        <p className="text-lg text-ink">{policies.returnsSummary}</p>
        <p>
          {returns.window}
        </p>
        <p>
          {returns.exchange}
        </p>
        <section>
          <h2 className="font-display text-2xl text-ink">{returns.headingHow}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              {returns.stepAccount} {returns.stepAlso}{" "}
              <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
                {support.email}
              </a>{" "}
              {returns.stepForm}{" "}
              <Link className="font-medium text-ink underline" href="/contact">
                {returns.contactLink}
              </Link>
              .{` ${returns.stepOrder}`}
            </li>
            <li>{returns.stepReply}</li>
            <li>{returns.stepShip}</li>
          </ol>
          <Link href="/account" className={`${buttonClassName("primary")} mt-6 w-full sm:w-fit`}>
            {returns.accountCta}
          </Link>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">{returns.headingAccount}</h2>
          <p className="mt-3">{policies.accountSummary}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {returns.accountItems.split("\n").map((item) => item.trim()).filter(Boolean).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <p>
          {returns.notWarranty} {returns.warrantyLead}{" "}
          <Link className="font-medium text-ink underline" href="/warranty">
            {returns.warrantyLink}
          </Link>
          .
        </p>
        <ReturnRequest />
      </div>
    </Container>
  );
}
