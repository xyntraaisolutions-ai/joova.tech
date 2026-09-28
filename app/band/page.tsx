import type { Metadata } from "next";
import Image from "next/image";
import { AppPreview } from "@/components/home/app-preview";
import { ColorPicker } from "@/components/home/color-picker";
import { DayStory } from "@/components/home/day-story";
import { FAQ } from "@/components/home/faq";
import { FinalCTA } from "@/components/home/final-cta";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SocialProof } from "@/components/home/social-proof";
import { SubscriptionCalculator } from "@/components/home/subscription-calculator";
import { TrustGrid } from "@/components/home/trust-grid";
import { BandProduct } from "@/components/product/band-product";
import { InTheBox } from "@/components/product/in-the-box";
import { SpecsTable } from "@/components/product/specs-table";
import { StrapShop } from "@/components/product/strap-shop";
import { UseAndCare } from "@/components/product/use-and-care";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  bandFeatures,
  bandImageSize,
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
      <PromiseStrip />
      <Section>
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink">
            Tracking
          </p>
          <h2 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What it tracks
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Sleep, heart rate, and activity, shown in the free Joova app. Wellness readings only.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bandFeatures.map((feature) => (
              <li key={feature.title} className="rounded-3xl border border-stone bg-white p-6">
                <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted">{feature.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <DayStory />
      <AppPreview />
      <SubscriptionCalculator />
      <ColorPicker />
      <Section id="straps" className="scroll-mt-24 bg-stone/40">
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
      <Section id="details" className="scroll-mt-24">
        <Container className="space-y-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink">
              Details
            </p>
            <h2 className="font-display mt-3 font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
              Included, care, and specs
            </h2>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="stage overflow-hidden rounded-[28px]">
              <Image
                src="/bands/joova-band-in-the-box-1600.png"
                alt="What's in the box: Joova Band, one extra strap, and a magnetic charging cable."
                width={bandImageSize.width}
                height={bandImageSize.height}
                className="h-auto w-full"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            </div>
            <div>
              <h3 className="font-display text-3xl font-extrabold">What&apos;s in the box</h3>
              <div className="mt-6">
                <InTheBox />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-display text-3xl font-extrabold">Battery, charging, and care</h3>
            <div className="mt-6">
              <UseAndCare />
            </div>
          </div>
          <div>
            <h3 className="font-display text-3xl font-extrabold">Specs</h3>
            <div className="mt-6">
              <SpecsTable />
            </div>
          </div>
        </Container>
      </Section>
      <TrustGrid />
      <SocialProof />
      <FAQ />
      <FinalCTA />
    </>
  );
}
