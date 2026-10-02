import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/blog-index";
import { loadContentBundle } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Stories on Joova technology and how the products fit a day. Wellness readings only.",
};

export default async function BlogPage() {
  const { blogPosts, catalog } = await loadContentBundle();
  const posts = [...blogPosts].sort((left, right) => right.publishedIso.localeCompare(left.publishedIso));
  return <BlogIndex posts={posts} catalog={[...catalog]} />;
}
