import type { Metadata } from "next";
import { LastUpdated } from "@/components/content/last-updated";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Joova accessibility statement. We aim for WCAG 2.2 AA.",
};

export default async function AccessibilityPage() {
  const { support, pageCopy } = await loadContentBundle();
  const accessibility = pageCopy.accessibility;
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Accessibility
      </h1>
      <LastUpdated value={accessibility.updatedOn} />
      <p className="mt-6 text-lg text-muted">
        {accessibility.body}{" "}
        <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
          {support.email}
        </a>
        .
      </p>
      <ul className="mt-8 space-y-3 text-muted">
        <li>A skip link moves keyboard focus to the page content.</li>
        <li>Form fields have visible labels, and buttons name the action they take.</li>
        <li>Motion pauses when the device asks for reduced motion.</li>
      </ul>
    </Container>
  );
}
