import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/blog-article";
import { mapBlogPost } from "@/lib/content/blog-map";
import { loadContentBundle } from "@/lib/content/load";
import { canAccess } from "@/lib/portal/roles";
import { readPortalProfile } from "@/lib/portal/session";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Blog preview",
  robots: { index: false, follow: false },
};

export default async function BlogPreviewPage({ params }: Props) {
  const session = await readPortalProfile();
  if (!session || !canAccess(session.profile.role, "content")) notFound();
  const { slug } = await params;
  const [postRow, sectionRows, bundle] = await Promise.all([
    session.supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle(),
    session.supabase.from("blog_sections").select("*").eq("post_slug", slug).order("sort"),
    loadContentBundle(),
  ]);
  if (!postRow.data || postRow.data.deleted_at) notFound();
  const post = mapBlogPost(postRow.data, sectionRows.data ?? []);
  const product = bundle.catalog.find((item) => item.id === post.productId);
  const relatedRow = post.relatedSlug
    ? await session.supabase.from("blog_posts").select("*").eq("slug", post.relatedSlug).maybeSingle()
    : null;
  const relatedSections = relatedRow?.data
    ? await session.supabase.from("blog_sections").select("*").eq("post_slug", post.relatedSlug).order("sort")
    : null;
  const related = relatedRow?.data ? mapBlogPost(relatedRow.data, relatedSections?.data ?? []) : undefined;
  const relatedProduct = related ? bundle.catalog.find((item) => item.id === related.productId) : undefined;
  return (
    <BlogArticle
      post={post}
      product={product}
      related={related}
      relatedProduct={relatedProduct}
      companyName={bundle.company.legalName}
      draft={postRow.data.published !== true}
    />
  );
}
