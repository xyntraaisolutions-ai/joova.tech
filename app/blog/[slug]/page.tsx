import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/blog-article";
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
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();
  const product = catalog.find((item) => item.id === post.productId);
  const related = blogPosts.find((item) => item.slug === post.relatedSlug);
  const relatedProduct = related ? catalog.find((item) => item.id === related.productId) : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedIso,
    image: post.bannerUrl || undefined,
    author: { "@type": "Organization", name: company.legalName },
    publisher: { "@type": "Organization", name: company.legalName },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogArticle
        post={post}
        product={product}
        related={related}
        relatedProduct={relatedProduct}
        companyName={company.legalName}
      />
    </>
  );
}
