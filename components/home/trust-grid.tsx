import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { loadContentBundle } from "@/lib/content/load";

export async function TrustGrid() {
  const { trustItems } = await loadContentBundle();
  return (
    <Section className="bg-paper">
      <Container>
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Built to be trusted
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-stone bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-ink/30"
            >
              <p className="font-display text-xl font-extrabold">{item.title}</p>
              <p className="mt-2 text-muted">{item.copy}</p>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
