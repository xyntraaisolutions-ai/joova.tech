import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { blogPosts } = await loadContentBundle();
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { blogPosts } = await loadContentBundle();
  const post = blogPosts.find((item) => item.slug === slug);
  return {
    title: post?.title ?? "Blog",
    description: post?.description,
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const { blogPosts, catalog, company, siteUrl } = await loadContentBundle();
  const SITE_URL = siteUrl;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const product = catalog.find((item) => item.id === post.productId);
  const related = blogPosts.find((item) => item.slug === post.relatedSlug);
  const relatedProduct = related
    ? catalog.find((item) => item.id === related.productId)
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedIso,
    author: {
      "@type": "Organization",
      name: company.legalName,
    },
    publisher: {
      "@type": "Organization",
      name: company.legalName,
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <Container className="py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto mt-2 w-full max-w-[40rem]">
        <Link href="/blog" className="inline-flex min-h-11 items-center text-sm font-bold text-ink underline underline-offset-4">
          All blogs
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[2.5px] text-muted">
          {product?.menuLabel}
        </p>
        <h1 className="mt-3 font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {company.legalName} · {post.published} · {post.readingMinutes} min read
        </p>
        <p className="mt-6 text-lg hyphens-auto text-justify">{post.excerpt}</p>
        <section className="mt-8 rounded-3xl border border-stone bg-white p-6 sm:p-8" aria-label="In short">
          <h2 className="font-display text-xl font-extrabold">In short</h2>
          <ul className="mt-4 space-y-3">
            {post.points.map((point) => (
              <li key={point} className="border-l-2 border-ink pl-4">
                {point}
              </li>
            ))}
          </ul>
        </section>
        {product ? (
          <div className="stage relative mt-8 aspect-[5/3] overflow-hidden rounded-[28px]">
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              priority
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-contain p-6 sm:p-10"
            />
          </div>
        ) : null}
        <nav className="mt-8 border-y border-stone py-4" aria-label="On this page">
          <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">On this page</p>
          <ol className="mt-2 grid gap-x-6 sm:grid-cols-2">
            {post.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-11 items-center font-bold text-ink">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-10 space-y-10">
          {post.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-32">
              <h2 className="font-display text-2xl font-extrabold md:text-3xl">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="hyphens-auto text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-stone pt-8 sm:flex-row sm:items-center sm:justify-between">
          {product ? (
            <Link href={product.href} className={buttonClassName("primary", "md")}>
              Shop {product.menuLabel}
            </Link>
          ) : null}
          {related ? (
            <Link
              href={`/blog/${related.slug}`}
              className="inline-flex min-h-11 items-center text-sm font-bold text-ink underline underline-offset-4"
            >
              Next: {relatedProduct?.menuLabel ?? related.title}
            </Link>
          ) : null}
        </div>
      </article>
    </Container>
  );
}
