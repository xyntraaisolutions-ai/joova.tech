import type { Metadata } from "next";
import Image from "next/image";
import { RingProduct } from "@/components/product/ring-product";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  noSubscription,
  RING_PRICE,
  ringBannerSize,
  ringFaqs,
  ringFeatures,
  ringImageSize,
  ringLineupSize,
  ringPriceLabel,
  SITE_URL,
} from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Ring",
  description: `Track sleep, heart rate, and activity with a stainless-steel smart ring. IP68, Apple Health, a free sizing kit, ${noSubscription} ${ringPriceLabel}.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Ring",
      description:
        "Stainless-steel smart ring for sleep, heart rate, and activity. IP68 / 5ATM. Silver, Black, and Rose Gold, in Classic or Wave. No subscription needed. Ever.",
      image: `${SITE_URL}/rings/joova-ring-silver-classic-1600.png`,
      brand: { "@type": "Brand", name: "Joova" },
      url: `${SITE_URL}/ring`,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: RING_PRICE,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/ring`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: ringFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function RingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <RingProduct />
      <Section className="bg-stone/40">
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What it tracks
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ringFeatures.map((feature) => (
              <li key={feature.title} className="rounded-3xl border border-stone bg-white p-6">
                <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted">{feature.detail}</p>
              </li>
            ))}
          </ul>
          <Image
            src="/rings/joova-ring-features-1600.png"
            alt="Joova Ring in six finish and style options. No subscription, stainless steel, IP68, about 3 days of battery, Apple Health, and free updates."
            width={ringImageSize.width}
            height={ringImageSize.height}
            className="mt-10 h-auto w-full"
            sizes="(min-width: 1024px) 1100px, 100vw"
          />
        </Container>
      </Section>
      <Section>
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <Image
            src="/rings/joova-ring-sizing-1600.png"
            alt="Find your perfect fit. US sizes 7 to 12, with a free sizing kit."
            width={ringImageSize.width}
            height={ringImageSize.height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
          <Image
            src="/rings/joova-ring-all-styles.png"
            alt="All Joova Ring options: Silver, Black, and Rose Gold, each in Classic and Wave."
            width={ringLineupSize.width}
            height={ringLineupSize.height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </Container>
      </Section>
      <Section className="bg-stone/40">
        <Container className="max-w-3xl">
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            Questions
          </h2>
          <dl className="mt-8 space-y-6">
            {ringFaqs.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-xl font-semibold">{item.q}</dt>
                <dd className="mt-2 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <Image
            src="/rings/joova-ring-hero-banner-1920x900.png"
            alt="Joova Ring. Smart ring. No subscription. Stainless steel, three finishes, two styles, $69.99."
            width={ringBannerSize.width}
            height={ringBannerSize.height}
            className="mt-12 h-auto w-full rounded-3xl"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </Container>
      </Section>
    </>
  );
}
