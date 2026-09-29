import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { catalog } from "@/content/catalog";
import { blogPosts } from "@/content/blog";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Read how the Joova Fitness Band and Smart Ring track activity. Wellness readings only. No subscription.",
};

export default function BlogPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Blogs
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Short reads on how Joova products track a day. Wellness and fitness only.
      </p>
      <ul className="mt-10 grid gap-6 md:grid-cols-2 md:grid-rows-[auto_auto_auto_1fr_auto] md:gap-x-6 md:gap-y-0">
        {blogPosts.map((post) => {
          const product = catalog.find((item) => item.id === post.productId);
          return (
            <li key={post.slug} className="md:row-span-5 md:grid md:grid-rows-subgrid">
              <Link
                href={`/blog/${post.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-[28px] border border-stone bg-white hover:border-ink/30 md:row-span-5 md:grid md:grid-rows-subgrid"
              >
                {product ? (
                  <div className="stage relative aspect-[5/3]">
                    <Image
                      src={product.image.src}
                      alt={product.image.alt}
                      fill
                      sizes="(min-width: 768px) 560px, 100vw"
                      className="object-contain p-6"
                    />
                  </div>
                ) : null}
                <p className="px-6 pt-6 text-xs font-bold uppercase tracking-[2.5px] text-muted md:px-8 md:pt-8">
                  {product?.menuLabel}
                </p>
                <h2 className="px-6 pt-3 font-display text-2xl font-extrabold leading-tight md:px-8 md:text-3xl">
                  {post.title}
                </h2>
                <p className="px-6 pt-3 text-muted md:px-8">{post.excerpt}</p>
                <p className="mt-auto px-6 pt-6 pb-6 text-sm font-bold text-ink md:mt-0 md:px-8 md:pb-8">
                  Read · {post.readingMinutes} min
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
