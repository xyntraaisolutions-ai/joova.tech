import type { Metadata } from "next";
import Link from "next/link";
import { AccountSignup } from "@/components/account/account-signup";
import { Container } from "@/components/ui/container";
import { policies } from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Customer Account",
  description: policies.accountSummary,
};

export default function AccountPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display" style={{ fontSize: "var(--text-h1)" }}>
        Joova Customer Account
      </h1>
      <p className="mt-6 text-lg">{policies.accountSummary}</p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-muted">
        <li>Purchase history</li>
        <li>Order tracking</li>
        <li>Returns, inside the 30-day free return window</li>
        <li>Replacements on a registered warranty claim</li>
        <li>Warranty registration for each eligible product</li>
      </ul>
      <p className="mt-6 text-muted">
        {policies.warrantyRegistration} The only free return window is{" "}
        <Link className="font-medium text-ink underline" href="/returns">
          30 days from delivery in the United States
        </Link>
        .
      </p>
      <AccountSignup />
    </Container>
  );
}
