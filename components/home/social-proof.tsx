import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function SocialProof() {
  return (
    <Section>
      <Container>
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Reviews
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Verified buyer reviews will appear here after we have at least 10
          real reviews. We do not invent ratings or viewer counts.
        </p>
        <p className="mt-6 text-muted">
          Creator videos will live on this wall with written permission.{" "}
          <Link href="/reviews" className="text-coral-ink underline">
            Reviews page
          </Link>
        </p>
      </Container>
    </Section>
  );
}
