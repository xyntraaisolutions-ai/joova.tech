import type { Metadata } from "next";
import { catalog, catalogCategories } from "@/content/catalog";
import { CategorySections } from "@/components/home/storefront";
import { Container } from "@/components/ui/container";
import { SITE_URL } from "@/content/site";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Joova wearables, smart devices, electronics, and accessories. The Fitness Band, Smart Ring, Joova Watch, Joova Glasses, Joova Buds, and Joova Share Pod are available now.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Joova shop",
  itemListElement: catalog.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.menuLabel,
    url: `${SITE_URL}${product.href.split("#")[0]}`,
  })),
};

export default function ShopPage() {
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
      <nav className="mt-8 flex flex-wrap gap-3" aria-label="Categories">
        {catalogCategories.map((category) => (
          <a
            key={category.id}
            href={category.href}
            className="inline-flex min-h-11 items-center rounded-full border border-stone px-4 text-sm font-medium hover:border-ink/30"
          >
            {category.label}
          </a>
        ))}
      </nav>
      <div className="mt-12">
        <CategorySections />
      </div>
    </Container>
  );
}
