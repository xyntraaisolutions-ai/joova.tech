import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { support } from "@/content/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Joova accessibility statement. We aim for WCAG 2.2 AA.",
};

export default function AccessibilityPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Accessibility
      </h1>
      <p className="mt-6 text-muted">
        We aim to meet WCAG 2.2 AA. Pages use semantic HTML, skip links,
        visible focus, and text labels on color swatches. If something blocks
        you, email{" "}
        <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
          {support.email}
        </a>
        .
      </p>
    </Container>
  );
}
