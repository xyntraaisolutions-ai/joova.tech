import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function SocialProof() {
  return (
    <Section className="pt-0">
      <Container>
        <div className="max-w-2xl rounded-3xl border border-stone bg-white p-6 md:p-8">
          <h2 className="font-display text-2xl font-extrabold">Reviews</h2>
          <p className="mt-3 text-muted">
            Verified buyer reviews will appear here after we have at least 10
            real reviews. We do not invent ratings or viewer counts.
          </p>
          <p className="mt-3 text-muted">
            Creator videos will live on this wall with written permission.{" "}
            <Link href="/reviews" className="text-ink underline">
              Reviews page
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
