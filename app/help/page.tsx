import type { Metadata } from "next";
import Link from "next/link";
import { helpArticles } from "@/content/site";
import { HelpSearch } from "@/components/help/help-search";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Help",
  description: "Setup, battery life, charging, handling, water, strap swap, and syncing for Joova Band.",
};

export default function HelpIndexPage() {
  return (
    <Container className="py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Help
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Short guides for setup, battery life, charging, handling, water, and
        strap swaps. Live chat comes later.
      </p>
      <HelpSearch />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {helpArticles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/help/${article.slug}`}
              className="block rounded-3xl border border-stone p-6 hover:border-ink/30"
            >
              <h2 className="font-display text-2xl font-extrabold">
                {article.title}
              </h2>
              <p className="mt-2 text-muted">{article.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
