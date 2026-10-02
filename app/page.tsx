import { Hero } from "@/components/home/hero";
import { Storefront } from "@/components/home/storefront";
import { loadContentBundle } from "@/lib/content/load";

export default async function HomePage() {
  const { siteUrl, company, siteDescription } = await loadContentBundle();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Joova",
        url: siteUrl,
        description: siteDescription,
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
        url: siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Storefront />
    </>
  );
}
