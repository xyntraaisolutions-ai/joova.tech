import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ClipboardList, UserRound } from "lucide-react";
import { RegisterDevice } from "@/components/warranty/register-device";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { pageCopy } = await loadContentBundle();
  return {
    title: pageCopy.warranty.title,
    description: pageCopy.warranty.intro,
  };
}

const steps = [
  { icon: UserRound, title: "1. Create your account" },
  { icon: ClipboardList, title: "2. Register the device" },
  { icon: BadgeCheck, title: "3. Extra year added" },
] as const;

export default async function WarrantyPage() {
  const { pageCopy } = await loadContentBundle();
  const warranty = pageCopy.warranty;
  const products = [
    [warranty.product1Name, warranty.product1Term, warranty.product1Extra],
    [warranty.product2Name, warranty.product2Term, warranty.product2Extra],
    [warranty.product3Name, warranty.product3Term, warranty.product3Extra],
    [warranty.product4Name, warranty.product4Term, warranty.product4Extra],
  ];
  const stepCopy = [warranty.step1, warranty.step2, warranty.step3];

  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display text-ink" style={{ fontSize: "var(--text-h1)" }}>
        {warranty.title}
      </h1>
      <p className="mt-4 text-lg text-ink">{warranty.intro}</p>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Eligible products</h2>
        <ul className="mt-4 space-y-3 md:hidden">
          {products.map(([name, term, extra]) => (
            <li key={name} className="rounded-3xl bg-white p-4">
              <p className="font-bold text-ink">{name}</p>
              <p className="mt-1">{term}</p>
              <p className="text-sm text-muted">{extra}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto rounded-3xl bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="text-ink">
              <tr className="border-b border-stone">
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Coverage</th>
                <th className="px-4 py-3 font-bold">When registered</th>
              </tr>
            </thead>
            <tbody>
              {products.map(([name, term, extra]) => (
                <tr key={name} className="border-b border-stone/70 last:border-0">
                  <td className="px-4 py-3 text-ink">{name}</td>
                  <td className="px-4 py-3">{term}</td>
                  <td className="px-4 py-3">{extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">{warranty.eligibleNote}</p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Covered</h2>
          <p className="mt-3">{warranty.covered}</p>
        </div>
        <div className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Not covered</h2>
          <p className="mt-3">{warranty.notCovered}</p>
        </div>
      </section>
      <p className="mt-4 text-ink">{warranty.remedy}</p>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Get 1 extra year</h2>
        <ol className="mt-4 grid gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-4 rounded-3xl bg-white p-5">
                <Icon className="mt-1 size-6 shrink-0 text-ink" aria-hidden />
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1">{stepCopy[index]}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <Link className={`${buttonClassName("primary", "sm")} mt-4`} href="/account?mode=register">
          Create a Joova Customer Account
        </Link>
      </section>

      <section id="register" className="mt-10 scroll-mt-24 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl text-ink">Register your device</h2>
        <p className="mt-2 text-sm text-muted">Registration is on joova.tech. Sign in with your Joova Customer Account to submit this form.</p>
        <div className="mt-4">
          <RegisterDevice />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">How to make a claim</h2>
        <p className="mt-3">{warranty.claim}</p>
        <p className="mt-3">
          <Link className="font-bold text-ink underline" href="/account#devices">
            My Devices
          </Link>
          {" · "}
          <Link className="font-bold text-ink underline" href="/contact">
            Contact form
          </Link>
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">{warranty.footerNote}</p>
    </Container>
  );
}
