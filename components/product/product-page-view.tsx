import Link from "next/link";
import { CatalogProductView } from "@/components/product/catalog-product";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { ProductPage } from "@/lib/content/product-page";

export function ProductPageView({ product, categoryLabel, related, siteUrl }: ProductPage) {
  const paragraphs = product.detail.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const canBuy = product.price > 0 && !product.unpriced && product.availability !== "out_of_stock";
  const image = product.image.src ? `${siteUrl}${product.image.src}` : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image,
    brand: { "@type": "Brand", name: "Joova" },
    url: `${siteUrl}${product.href}`,
    offers: product.price > 0 && !product.unpriced
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price: product.price,
          availability: product.availability === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: `${siteUrl}${product.href}`,
        }
      : undefined,
  };

  return (
    <div className={canBuy ? "max-md:pb-28" : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="py-8 md:py-12">
        <p className="mb-6 text-sm text-muted">
          <Link href="/shop" className="font-bold text-ink underline">Shop</Link>
          <span> / {categoryLabel}</span>
        </p>
        <CatalogProductView product={product} categoryLabel={categoryLabel} />
      </Container>
      {product.signals.length ? (
        <Section className="bg-stone/40">
          <Container>
            <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>At a glance</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.signals.map((signal) => (
                <li key={signal.label} className="rounded-3xl border border-stone bg-white p-6">
                  <h3 className="font-display text-2xl font-semibold">{signal.label}</h3>
                  <p className="mt-2 text-muted">{signal.text}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
      {paragraphs.length || product.note ? (
        <Section>
          <Container className="max-w-3xl">
            <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>About this product</h2>
            <div className="mt-6 space-y-4">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="text-muted">{paragraph}</p>
              ))}
            </div>
            {product.note ? <p className="mt-6 rounded-3xl border border-stone bg-white p-6 font-medium">{product.note}</p> : null}
          </Container>
        </Section>
      ) : null}
      {related.length ? (
        <Section className="bg-stone/40">
          <Container>
            <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>More in {categoryLabel}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} actions />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </div>
  );
}
