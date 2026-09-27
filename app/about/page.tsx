import type { Metadata } from "next";
import { company } from "@/content/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About Joova",
  description: "Joova makes a screenless fitness tracker with no subscription.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        About Joova
      </h1>
      <p className="mt-6 text-lg text-muted">
        Joova Band is a screenless fitness tracker. One price. No monthly fee.
        Three straps in the box. Built for sleep, activity, heart-rate trends,
        and recovery — wellness language only.
      </p>
      <p className="mt-6 text-muted">
        Founder story and team photos will go here when they are ready. We will
        not use stock people as if they were the team.
      </p>
      <p className="mt-8 text-sm text-muted">
        {company.legalName}
        <br />
        {company.address}
      </p>
    </Container>
  );
}
