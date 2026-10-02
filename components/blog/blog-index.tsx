import Link from "next/link";
import type { BlogPost } from "@/content/blog";
import type { CatalogProduct } from "@/content/catalog";
import { BlogCover } from "@/components/blog/blog-cover";
import { Container } from "@/components/ui/container";

export function BlogIndex({
  posts,
  catalog,
}: {
  posts: BlogPost[];
  catalog: CatalogProduct[];
}) {
  const [featured, ...rest] = posts;
  const productOf = (id: string) => catalog.find((item) => item.id === id);

  return (
    <Container className="py-10 md:py-16">
      <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">Journal</p>
      <h1 className="mt-3 max-w-3xl font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Blogs
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Stories on the technology Joova builds, and how the products fit a day. Wellness and fitness only.
      </p>
      {featured ? (
        <Featured post={featured} product={productOf(featured.productId)} />
      ) : (
        <p className="mt-10 text-muted">The first story is on its way.</p>
      )}
      {rest.length > 0 ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <StoryCard key={post.slug} post={post} product={productOf(post.productId)} />
          ))}
        </ul>
      ) : null}
    </Container>
  );
}

function Featured({ post, product }: { post: BlogPost; product?: CatalogProduct }) {
  return (
    <article className="mt-10">
      <Link
        href={`/blog/${post.slug}`}
        className="grid w-full overflow-hidden rounded-[28px] border border-stone bg-white hover:border-ink/30 lg:grid-cols-2"
      >
        <BlogCover
          bannerUrl={post.bannerUrl}
          bannerAlt={post.bannerAlt || post.title}
          fallback={product?.image}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[16/10] lg:aspect-auto lg:min-h-[28rem]"
        />
        <div className="flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">
            Featured{product ? ` · ${product.menuLabel}` : ""}
          </p>
          <h2 className="mt-3 font-display font-extrabold leading-tight" style={{ fontSize: "var(--text-h2)" }}>
            {post.title}
          </h2>
          <p className="mt-4 text-lg text-muted">{post.excerpt}</p>
          <p className="mt-6 text-sm font-bold text-ink">
            Read the story · {post.readingMinutes} min
          </p>
        </div>
      </Link>
    </article>
  );
}

function StoryCard({ post, product }: { post: BlogPost; product?: CatalogProduct }) {
  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[28px] border border-stone bg-white hover:border-ink/30"
      >
        <BlogCover
          bannerUrl={post.bannerUrl}
          bannerAlt={post.bannerAlt || post.title}
          fallback={product?.image}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
        />
        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">
            {product?.menuLabel || "Technology"}
            {post.published ? ` · ${post.published}` : ""}
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">{post.title}</h2>
          <p className="mt-3 text-muted">{post.excerpt}</p>
          <p className="mt-auto pt-6 text-sm font-bold text-ink">{post.readingMinutes} min read</p>
        </div>
      </Link>
    </li>
  );
}
