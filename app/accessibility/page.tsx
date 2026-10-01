import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Joova accessibility statement. We aim for WCAG 2.2 AA.",
};

export default async function AccessibilityPage() {
  const { support, pageCopy } = await loadContentBundle();
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Accessibility
      </h1>
      <p className="mt-6 text-muted">
        {pageCopy.accessibility.body}{" "}
        <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
          {support.email}
        </a>
        .
      </p>
    </Container>
  );
}
