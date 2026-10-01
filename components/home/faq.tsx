import { Accordion } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { loadContentBundle } from "@/lib/content/load";

export async function FAQ() {
  const { faqs } = await loadContentBundle();
  return (
    <Section>
      <Container className="max-w-3xl">
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Questions
        </h2>
        <Accordion className="mt-8" items={faqs} />
      </Container>
    </Section>
  );
}
