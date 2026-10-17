import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { catalog } = await loadContentBundle();
  const names = catalog.map((product) => product.name);
  const listed = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return {
    title: "Shop",
    description: listed ? `Shop Joova on the website now: ${listed}.` : "Shop Joova wearables and accessories.",
  };
}

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
