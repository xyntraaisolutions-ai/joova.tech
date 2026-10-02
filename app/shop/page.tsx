import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Joova wearables, smart devices, electronics, and accessories. The Fitness Band, Smart Ring, Joova Watch, Joova Glasses, Joova Buds, and Joova Share Pod are available now.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const { catalog, catalogCategories, siteUrl } = await loadContentBundle();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Joova shop",
    itemListElement: catalog.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.menuLabel,
      url: `${siteUrl}${product.href.split("#")[0]}`,
    })),
  };

  return (
    <Container className="py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Shop
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Wearables, electronics, and accessories. The home page leads with the current highlights. Everything we sell is on this page.
      </p>
      <ShopCatalog catalog={[...catalog]} categories={catalogCategories} query={params.q ?? ""} />
    </Container>
  );
}
