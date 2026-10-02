import Link from "next/link";
import type { BlogPost } from "@/content/blog";
import type { CatalogProduct } from "@/content/catalog";
import { BlogCover } from "@/components/blog/blog-cover";
import { BlogProgress } from "@/components/blog/blog-progress";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function BlogArticle({
  post,
  product,
  related,
  relatedProduct,
  companyName,
  draft = false,
}: {
  post: BlogPost;
  product?: CatalogProduct;
  related?: BlogPost;
  relatedProduct?: CatalogProduct;
  companyName: string;
  draft?: boolean;
}) {
  return (
    <>
      <BlogProgress />
      <Container className="py-10 md:py-16">
        <article>
          {draft ? (
            <p className="mb-6 inline-flex rounded-full bg-coral px-3 py-1 text-sm font-bold text-ink">
              Draft preview. This story is not on the public blog yet.
            </p>
          ) : null}
          <Link href="/blog" className="inline-flex min-h-11 items-center text-sm font-bold text-ink underline underline-offset-4">
            All blogs
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[2.5px] text-muted">
            {product?.menuLabel || "Technology"}
          </p>
          <h1 className="mt-3 max-w-4xl font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {companyName} · {post.published} · {post.readingMinutes} min read
          </p>
          <BlogCover
            bannerUrl={post.bannerUrl}
            bannerAlt={post.bannerAlt || post.title}
            fallback={product?.image}
            priority
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="mt-8 aspect-[16/9] rounded-[28px]"
          />
          <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,40rem)_18rem] lg:items-start lg:gap-14">
            <div>
              <p className="text-xl leading-relaxed">{post.excerpt}</p>
              <div className="mt-10 space-y-12">
                {post.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-32">
                    <h2 className="font-display text-3xl font-extrabold">{section.heading}</h2>
                    <div className="mt-4 space-y-4 text-lg leading-relaxed">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
            <aside className="mt-10 space-y-6 lg:sticky lg:top-28 lg:mt-0">
              {post.points.length > 0 ? (
                <section className="rounded-3xl border border-stone bg-white p-6" aria-label="In short">
                  <h2 className="font-display text-xl font-extrabold">In short</h2>
                  <ul className="mt-4 space-y-3">
                    {post.points.map((point) => (
                      <li key={point} className="border-l-2 border-coral pl-4">
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {post.sections.length > 0 ? (
                <nav className="rounded-3xl border border-stone p-6" aria-label="On this page">
                  <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">On this page</p>
                  <ol className="mt-3 space-y-1">
                    {post.sections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="inline-flex min-h-11 items-center font-bold text-ink">
                          {section.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}
              {product ? (
                <Link href={product.href} className={buttonClassName("primary", "md")}>
                  Shop {product.menuLabel}
                </Link>
              ) : null}
            </aside>
          </div>
          {related ? (
            <section className="mt-16 border-t border-stone pt-10" aria-label="Next story">
              <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">Next story</p>
              <Link href={draft ? `/blog/preview/${related.slug}` : `/blog/${related.slug}`} className="mt-4 grid overflow-hidden rounded-[28px] border border-stone bg-white hover:border-ink/30 sm:grid-cols-[16rem_minmax(0,1fr)]">
                <BlogCover
                  bannerUrl={related.bannerUrl}
                  bannerAlt={related.bannerAlt || related.title}
                  fallback={relatedProduct?.image}
                  sizes="256px"
                  className="aspect-[16/10] sm:aspect-auto sm:min-h-40"
                />
                <div className="p-6">
                  <h2 className="font-display text-2xl font-extrabold">{related.title}</h2>
                  <p className="mt-2 text-muted">{related.excerpt}</p>
                </div>
              </Link>
            </section>
          ) : null}
        </article>
      </Container>
    </>
  );
}
