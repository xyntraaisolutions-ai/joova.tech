import type { Metadata } from "next";
import Link from "next/link";
import { company, PRICE } from "@/content/site";
import { Container } from "@/components/ui/container";
import { formatUsd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Joova",
  description: "Joova makes a screenless fitness tracker with no subscription.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        About Joova
      </h1>
      <p className="mt-6 text-lg text-muted">
        Joova Band is a screenless fitness tracker. {formatUsd(PRICE)}. No
        monthly fee. Five colors: Black, Blue, Green, Orange, and Red. A black
        tracker, a silver buckle, and two straps in the box. You choose both
        colors when you order. Built for sleep,
        activity, heart-rate trends, and recovery.
      </p>
      <p className="mt-6 text-muted">
        Founder story and team photos will go here when they are ready. We will
        not use stock people as if they were the team.
      </p>
      <p className="mt-8">
        <Link href="/contact" className="font-medium underline">
          Contact support
        </Link>
      </p>
      <p className="mt-8 text-sm text-muted">
        {company.legalName}
        <br />
        Business address: {company.address}
      </p>
    </Container>
  );
}
