import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";
import { helpArticles } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/band",
    "/ring",
    "/share",
    "/app",
    "/reviews",
    "/warranty",
    "/returns",
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
