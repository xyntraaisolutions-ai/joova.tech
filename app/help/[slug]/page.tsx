import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { helpArticles } from "@/content/site";
import { Container } from "@/components/ui/container";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = helpArticles.find((item) => item.slug === slug);
  return {
    title: article?.title ?? "Help",
    description: article?.summary,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = helpArticles.find((item) => item.slug === slug);
  if (!article) notFound();

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
    </Container>
  );
}
