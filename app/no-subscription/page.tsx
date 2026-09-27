import type { Metadata } from "next";
import Link from "next/link";
import { SubscriptionCalculator } from "@/components/home/subscription-calculator";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "No subscription",
  description:
    "Every feature in the Joova app is free. We will never charge a monthly fee for features you bought with your band.",
};

export default function NoSubscriptionPage() {
  return (
    <>
      <Container className="pt-10 md:pt-16">
        <h1
          className="font-display max-w-3xl font-extrabold"
          style={{ fontSize: "var(--text-h1)" }}
        >
          Every feature in the Joova app is free.
        </h1>
        <p className="mt-6 max-w-2xl text-lg">
          We will never charge a monthly fee for features you bought with your
          band. That promise is also in our{" "}
          <Link href="/terms" className="text-coral-ink underline">
            Terms
          </Link>
          .
        </p>
      </Container>
      <SubscriptionCalculator full />
    </>
  );
}
