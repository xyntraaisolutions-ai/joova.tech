import type { Metadata } from "next";
import Image from "next/image";
import { AddToCart } from "@/components/product/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  BUDS_PRICE,
  SITE_URL,
  budsBannerSize,
  budsFacts,
  budsFaqs,
  budsFeatures,
  budsImageSize,
  budsPriceLabel,
} from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Buds",
  description: `Bluetooth 6.0 wireless earbuds with a pocket USB-C charging case and up to 5 hours per charge. ${budsPriceLabel} from Joova. Available now.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Buds",
      description:
        "Wireless earbuds with Bluetooth 6.0, up to 5 hours of playtime per charge, and a pocket charging case with USB-C. Available now.",
      brand: { "@type": "Brand", name: "Joova" },
      image: `${SITE_URL}/buds/joova-buds-black-white-1600.png`,
      url: `${SITE_URL}/buds`,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: BUDS_PRICE,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/buds`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: budsFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function BudsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <div className="stage rounded-[24px] p-4 sm:p-6">
          <Image
            src="/buds/joova-buds-black-white-1600.png"
            alt="Joova Buds in black with a white charging case on a white background"
            width={budsImageSize.width}
            height={budsImageSize.height}
            priority
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            Electronics
          </p>
          <h1
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Joova Buds
          </h1>
          <p className="mt-3 font-display text-3xl font-semibold">Press play. Take it anywhere.</p>
          <p className="mt-3 text-2xl">{budsPriceLabel}</p>
          <Badge className="mt-4">Available now</Badge>
          <p className="mt-6 text-muted">
            Bluetooth 6.0 earbuds that pair fast and stay connected, with a
            pocket-size charging case you can top up anywhere with USB-C.
          </p>
          <p className="mt-3 text-muted">
            Black or White. These are a single pair of earbuds, separate from
            Joova Share Pod.
          </p>
          <AddToCart id="buds" name="Joova Buds" price={BUDS_PRICE} colors={["Black", "White"]} />
        </div>
      </Container>

      <Section className="bg-stone/40">
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What they do
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budsFeatures.map((feature) => (
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
              {budsFacts.map((fact) => (
                <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm text-muted">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <Image
              src="/buds/joova-buds-features-1600.png"
              alt="Joova Buds feature card: Bluetooth 6.0, 10 to 15 meter range, up to 5 hours playtime, USB-C case, and 300 plus hours standby"
              width={budsImageSize.width}
              height={budsImageSize.height}
              className="h-auto w-full"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </Container>
      </Section>

      <Section className="bg-stone/40">
        <Container className="max-w-3xl">
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            Questions
          </h2>
          <dl className="mt-8 space-y-6">
            {budsFaqs.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-xl font-semibold">{item.q}</dt>
                <dd className="mt-2 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <Image
            src="/buds/joova-buds-hero-banner-1920x900.png"
            alt="Joova Buds banner. Press play. Take it anywhere. Wireless earbuds with a charging case."
            width={budsBannerSize.width}
            height={budsBannerSize.height}
            className="mt-12 h-auto w-full rounded-3xl"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </Container>
      </Section>
    </>
  );
}
