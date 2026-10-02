import type { BlogPost } from "@/content/blog";

type Row = Record<string, unknown>;

export function mapBlogPost(post: Row, sections: Row[]): BlogPost {
  return {
    slug: String(post.slug ?? ""),
    productId: typeof post.product_id === "string" ? post.product_id : "",
    title: String(post.title ?? ""),
    description: String(post.description ?? ""),
    excerpt: String(post.excerpt ?? ""),
    published: String(post.published_label ?? ""),
    publishedIso: String(post.published_iso ?? ""),
    readingMinutes: Number(post.reading_minutes) || 1,
    points: Array.isArray(post.points) ? post.points.filter((point): point is string => typeof point === "string") : [],
    relatedSlug: typeof post.related_slug === "string" ? post.related_slug : "",
    bannerUrl: typeof post.banner_url === "string" ? post.banner_url : "",
    bannerAlt: typeof post.banner_alt === "string" ? post.banner_alt : "",
    sections: sections
      .filter((section) => section.post_slug === post.slug)
      .map((section) => ({
        id: String(section.section_id ?? section.id ?? ""),
        heading: String(section.heading ?? ""),
        paragraphs: Array.isArray(section.paragraphs)
          ? section.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string")
          : [],
      })),
  };
}
