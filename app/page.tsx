import { Hero } from "@/components/home/hero";
import { ProductIndex } from "@/components/home/product-index";
import { SITE_URL, company } from "@/content/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Joova",
      url: SITE_URL,
      legalName: company.legalName,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Grapevine",
        addressRegion: "TX",
        addressCountry: "US",
      },
    },
    {
      "@type": "WebSite",
      name: "Joova",
      url: SITE_URL,
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <ProductIndex />
    </>
  );
}
