import type { MetadataRoute } from "next";
import { blogPosts } from "@/content/blog";
import { SITE_URL } from "@/content/site";
import { helpArticles } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/shop",
    "/wishlist",
    "/deals",
    "/band",
    "/ring",
    "/share",
    "/glasses",
    "/watch",
    "/buds",
    "/app",
    "/reviews",
    "/videos",
    "/blog",
    ...blogPosts.map((post) => `/blog/${post.slug}`),
    "/warranty",
    "/returns",
    "/account",
    "/track",
    "/help",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
    ...helpArticles.map((article) => `/help/${article.slug}`),
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
