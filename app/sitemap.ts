import type { MetadataRoute } from "next";
import { loadContentBundle } from "@/lib/content/load";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { blogPosts, helpArticles, siteUrl, catalog } = await loadContentBundle();
  const SITE_URL = siteUrl;
  const paths = [...new Set([
    "",
    "/shop",
    "/deals",
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
    ...catalog.map((product) => product.href.split("#")[0]).filter((href) => href.startsWith("/") && href !== "/"),
  ])];

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
