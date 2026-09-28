import type { Metadata } from "next";
import { AppPreview } from "@/components/home/app-preview";
import { BoxDesign } from "@/components/home/box-design";
import { ColorPicker } from "@/components/home/color-picker";
import { DayStory } from "@/components/home/day-story";
import { FAQ } from "@/components/home/faq";
import { FinalCTA } from "@/components/home/final-cta";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SocialProof } from "@/components/home/social-proof";
import { SubscriptionCalculator } from "@/components/home/subscription-calculator";
import { TrustGrid } from "@/components/home/trust-grid";
import { BandProduct } from "@/components/product/band-product";
import { StrapShop } from "@/components/product/strap-shop";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { faqs, policies, PRICE, priceLabel, SITE_URL, strapPriceLabel } from "@/content/site";

export const metadata: Metadata = {
  title: "Faceless Fitness Tracker Band",
  description: `Pre-order Joova Band for ${priceLabel} before Nov 15. Launches Nov 18. Two straps in every box. Extra straps ${strapPriceLabel} each. No subscription. Ever.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Band",
      description: "Screenless fitness tracker with two straps in every box. You choose both colors.",
      brand: { "@type": "Brand", name: "Joova" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: PRICE,
        availability: "https://schema.org/PreOrder",
        url: `${SITE_URL}/band`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function BandPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <BandProduct />
      <PromiseStrip />
      <DayStory />
      <ColorPicker />
      <BoxDesign />
      <Section id="straps" className="scroll-mt-24">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral-ink">
            Straps only
          </p>
          <h2
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            A strap, without the band.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Every Joova Band box includes the strap you wear plus one extra. You
            can also buy woven straps on their own for {strapPriceLabel} each.
            Pick a color and quantity. The tracker and charger stay with the band.{" "}
            {policies.strapSummary}
          </p>
          <StrapShop />
        </Container>
      </Section>
      <SubscriptionCalculator />
      <AppPreview />
      <SocialProof />
      <TrustGrid />
      <FAQ />
      <FinalCTA />
    </>
  );
}
