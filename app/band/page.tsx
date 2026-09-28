import type { Metadata } from "next";
import Image from "next/image";
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
import {
  bandBannerSize,
  bandFeatures,
  bandImageSize,
  bandLineupSize,
  faqs,
  noSubscription,
  policies,
  PRICE,
  priceLabel,
  SITE_URL,
  strapPriceLabel,
} from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Band",
  description: `Track sleep, heart rate, and activity with a screenless band that lasts up to 20–30 days per charge. 5 colors, a free extra strap, ${noSubscription} ${priceLabel}.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Band",
      description: `Screenless fitness tracker for sleep, heart rate, and activity. Up to 20–30 days per charge. Five colors, one extra strap in the box. ${noSubscription}`,
      image: `${SITE_URL}/bands/joova-band-black-1600.png`,
      brand: { "@type": "Brand", name: "Joova" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: PRICE,
        availability: "https://schema.org/InStock",
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
      <Section>
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What it tracks
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bandFeatures.map((feature) => (
              <li key={feature.title} className="rounded-3xl border border-stone bg-white p-6">
                <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted">{feature.detail}</p>
              </li>
            ))}
          </ul>
          <Image
            src="/bands/joova-band-features-1600.png"
            alt="Joova Band in five colors. No subscription, sleep tracking, heart rate, up to 20 to 30 days of battery, magnetic charging, and two straps in the box."
            width={bandImageSize.width}
            height={bandImageSize.height}
            className="mt-10 h-auto w-full"
            sizes="(min-width: 1024px) 1100px, 100vw"
          />
        </Container>
      </Section>
      <Section className="bg-stone/40">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Image
            src="/bands/joova-band-in-the-box-1600.png"
            alt="What's in the box: Joova Band, one extra strap, and a magnetic charging cable."
            width={bandImageSize.width}
            height={bandImageSize.height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
          <Image
            src="/bands/joova-band-all-colors.png"
            alt="Joova Band lineup in black, blue, green, orange, and red."
            width={bandLineupSize.width}
            height={bandLineupSize.height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </Container>
      </Section>
      <Section>
        <Container>
          <Image
            src="/bands/joova-band-hero-banner-1920x900.png"
            alt="Joova Band. Track everything. Pay once. Screenless fitness tracker, no subscription, $59.99."
            width={bandBannerSize.width}
            height={bandBannerSize.height}
            className="h-auto w-full rounded-3xl"
            sizes="100vw"
          />
        </Container>
      </Section>
      <PromiseStrip />
      <DayStory />
      <ColorPicker />
      <BoxDesign />
      <Section id="straps" className="scroll-mt-24">
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink">
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
            Pick a color and quantity. The tracker and magnetic cable stay with the band.{" "}
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
