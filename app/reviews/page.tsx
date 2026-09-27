import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Real Joova reviews will appear here after we have at least 10 verified buyer reviews.",
};

export default function ReviewsPage() {
  return (
    <Container className="py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Reviews
      </h1>
      <p className="mt-6 max-w-2xl text-muted">
        This page stays empty until we have at least 10 genuine reviews. Paid
        creator content will be marked. We never fabricate ratings.
      </p>
    </Container>
  );
}
