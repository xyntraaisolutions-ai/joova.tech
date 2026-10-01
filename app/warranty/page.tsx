import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ClipboardList, UserRound } from "lucide-react";
import { LastUpdated } from "@/components/content/last-updated";
import { RegisterDevice } from "@/components/warranty/register-device";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { coverageFromCatalog } from "@/lib/catalog/coverage";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { pageCopy } = await loadContentBundle();
  return {
    title: pageCopy.warranty.title,
    description: pageCopy.warranty.intro,
  };
}

const stepIcons = [UserRound, ClipboardList, BadgeCheck] as const;

export default async function WarrantyPage() {
  const { pageCopy, catalog } = await loadContentBundle();
  const warranty = pageCopy.warranty;
  const products = catalog.map((product) => {
    const coverage = product.coverage ?? coverageFromCatalog(product);
    return { id: product.id, name: product.name, ...coverage };
  });
  const steps = [
    { title: warranty.step1Title, copy: warranty.step1 },
    { title: warranty.step2Title, copy: warranty.step2 },
    { title: warranty.step3Title, copy: warranty.step3 },
  ];

  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display font-extrabold text-ink" style={{ fontSize: "var(--text-h1)" }}>
        {warranty.title}
      </h1>
      <LastUpdated value={warranty.updatedOn} />
      <p className="mt-4 text-lg text-ink">{warranty.intro}</p>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">{warranty.headingEligible}</h2>
        <ul className="mt-4 space-y-3 md:hidden">
          {products.map((product) => (
            <li key={product.id} className="rounded-3xl bg-white p-4">
              <p className="font-bold text-ink">{product.name}</p>
              <p className="mt-1">{product.warranty}</p>
              <p className="text-sm text-muted">{product.shipping}</p>
              <p className="text-sm text-muted">{product.returns}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto rounded-3xl bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="text-ink">
              <tr className="border-b border-stone">
                <th className="px-4 py-3 font-bold">{warranty.columnProduct}</th>
                <th className="px-4 py-3 font-bold">{warranty.columnWarranty}</th>
                <th className="px-4 py-3 font-bold">{warranty.columnShipping}</th>
                <th className="px-4 py-3 font-bold">{warranty.columnReturns}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-stone/70 last:border-0">
                  <td className="px-4 py-3 text-ink">{product.name}</td>
                  <td className="px-4 py-3">{product.warranty}</td>
                  <td className="px-4 py-3">{product.shipping}</td>
                  <td className="px-4 py-3">{product.returns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">{warranty.eligibleNote}</p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">{warranty.headingCovered}</h2>
          <p className="mt-3">{warranty.covered}</p>
        </div>
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">{warranty.headingNotCovered}</h2>
          <p className="mt-3">{warranty.notCovered}</p>
        </div>
      </section>
      <p className="mt-4 text-ink">{warranty.remedy}</p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">{warranty.headingShipping}</h2>
          <p className="mt-3">{warranty.shippingNote}</p>
        </div>
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">{warranty.headingReturns}</h2>
          <p className="mt-3">{warranty.returnsNote}</p>
          <p className="mt-3">
            <Link className="font-bold text-ink underline" href="/returns">{warranty.returnLink}</Link>
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">{warranty.headingExtra}</h2>
        <ol className="mt-4 grid gap-4">
          {steps.map((step, index) => {
            const Icon = stepIcons[index] ?? BadgeCheck;
            return (
              <li key={step.title} className="flex gap-4 rounded-3xl bg-white p-5">
                <Icon className="mt-1 size-6 shrink-0 text-ink" aria-hidden />
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1">{step.copy}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <Link className={`${buttonClassName("primary", "sm")} mt-4`} href="/account?mode=register">
          {warranty.accountCta}
        </Link>
      </section>

      <section id="register" className="mt-10 scroll-mt-24 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl text-ink">{warranty.headingRegister}</h2>
        <p className="mt-2 text-sm text-muted">{warranty.registerNote}</p>
        <div className="mt-4">
          <RegisterDevice />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">{warranty.headingClaim}</h2>
        <p className="mt-3">{warranty.claim}</p>
        <p className="mt-3">
          <Link className="font-bold text-ink underline" href="/account#devices">
            {warranty.devicesLink}
          </Link>
          {" · "}
          <Link className="font-bold text-ink underline" href="/contact">
            {warranty.contactLink}
          </Link>
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">{warranty.footerNote}</p>
    </Container>
  );
}
