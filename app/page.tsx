import { AppPreview } from "@/components/home/app-preview";
import { BoxDesign } from "@/components/home/box-design";
import { ColorPicker } from "@/components/home/color-picker";
import { DayStory } from "@/components/home/day-story";
import { FAQ } from "@/components/home/faq";
import { FinalCTA } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SocialProof } from "@/components/home/social-proof";
import { SubscriptionCalculator } from "@/components/home/subscription-calculator";
import { TrustGrid } from "@/components/home/trust-grid";
import { PRICE, priceLabel, SITE_URL, company, faqs } from "@/content/site";

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
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "Product",
      name: "Joova Band",
      description:
        `Screenless fitness tracker. ${priceLabel}. No subscription. Ever.`,
      brand: { "@type": "Brand", name: "Joova" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: PRICE,
        availability: "https://schema.org/PreOrder",
        url: `${SITE_URL}/band`,
      },
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
      <PromiseStrip />
      <DayStory />
      <ColorPicker />
      <BoxDesign />
      <SubscriptionCalculator />
      <AppPreview />
      <SocialProof />
      <TrustGrid />
      <FAQ />
      <FinalCTA />
    </>
  );
}
