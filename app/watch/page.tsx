import type { Metadata } from "next";
import Image from "next/image";
import { WatchProduct } from "@/components/product/watch-product";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  SITE_URL,
  WATCH_PRICE,
  noSubscription,
  watchBannerSize,
  watchFacts,
  watchFaqs,
  watchFeatures,
  watchImageSize,
  watchLineupSize,
  watchPriceLabel,
} from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Watch",
  description: `Smart watch with Bluetooth calls, a 1.81" color screen, and heart rate and sleep tracking. Black or Orange. ${noSubscription} ${watchPriceLabel}. Available now.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Watch",
      description:
        "Smart watch with Bluetooth calls, a 1.81-inch color touch screen, heart rate and sleep tracking, and sports modes. No subscription needed. Ever. Available now.",
      brand: { "@type": "Brand", name: "Joova" },
      image: `${SITE_URL}/watches/joova-watch-black-1600.png`,
      url: `${SITE_URL}/watch`,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: WATCH_PRICE,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/watch`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: watchFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function WatchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <WatchProduct />

      <Section className="bg-stone/40">
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What it does
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {watchFeatures.map((feature) => (
              <li key={feature.title} className="rounded-3xl border border-stone bg-white p-6">
                <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted">{feature.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
              Specifications
            </h2>
            <dl className="mt-8 divide-y divide-stone border-y border-stone">
              {watchFacts.map((fact) => (
                <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm text-muted">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <Image
              src="/watches/joova-watch-features-1600.png"
              alt="Joova Watch feature card: no subscription, 1.81 inch color screen, Bluetooth calls, heart rate and sleep, sports modes, and multi-day battery"
              width={watchImageSize.width}
              height={watchImageSize.height}
              className="h-auto w-full"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </Container>
      </Section>

      <Section className="bg-stone/40">
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            Black or Orange
          </h2>
          <Image
            src="/watches/joova-watch-both-colors.png"
            alt="Joova Watch in black and orange, side by side on a white background"
            width={watchLineupSize.width}
            height={watchLineupSize.height}
            className="mt-8 h-auto w-full"
            sizes="(min-width: 1024px) 1120px, 100vw"
          />
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            Questions
          </h2>
          <dl className="mt-8 space-y-6">
            {watchFaqs.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-xl font-semibold">{item.q}</dt>
                <dd className="mt-2 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <Image
            src="/watches/joova-watch-hero-banner-1920x900.png"
            alt="Joova Watch banner. Calls on your wrist. No subscription. Black and orange watches."
            width={watchBannerSize.width}
            height={watchBannerSize.height}
            className="mt-12 h-auto w-full rounded-3xl"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </Container>
      </Section>
    </>
  );
}
