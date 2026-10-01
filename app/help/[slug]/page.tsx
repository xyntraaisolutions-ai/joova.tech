import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { helpArticles } = await loadContentBundle();
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { helpArticles } = await loadContentBundle();
  const article = helpArticles.find((item) => item.slug === slug);
  return {
    title: article?.title ?? "Help",
    description: article?.summary,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const { helpArticles, catalog } = await loadContentBundle();
  const index = helpArticles.findIndex((item) => item.slug === slug);
  const article = index >= 0 ? helpArticles[index] : undefined;
  if (!article) notFound();
  const next = helpArticles[(index + 1) % helpArticles.length];
  const band = catalog.find((product) => product.id === "band");

  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <Link href="/help" className="text-sm text-ink underline">
        All help articles
      </Link>
      <h1
        className="font-display mt-4 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        {article.title}
      </h1>
      <div className="mt-8 space-y-4">
        {article.body.split("\n\n").map((paragraph) => (
          <p key={paragraph} className="text-lg text-muted">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-4 border-t border-stone pt-8 sm:flex-row sm:items-center sm:justify-between">
        {band ? (
          <Link href={band.href} className="font-bold text-ink underline">
            Shop {band.menuLabel}
          </Link>
        ) : null}
        {next && next.slug !== article.slug ? (
          <Link href={`/help/${next.slug}`} className="font-bold text-ink underline">
            Next: {next.title}
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
