import type { Metadata } from "next";
import Image from "next/image";
import { AddToCart } from "@/components/product/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  GLASSES_PRICE,
  SITE_URL,
  glassesBannerSize,
  glassesFacts,
  glassesFaqs,
  glassesFeatures,
  glassesImageSize,
  glassesPriceLabel,
  noSubscription,
} from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Glasses",
  description: `Hands-free 8MP photos, live translation, and an AI assistant in everyday glasses. IP65, Wi-Fi transfer, ${noSubscription} ${glassesPriceLabel}. Available now.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "Joova Glasses",
      description:
        "AI camera glasses with an 8MP camera, live translation, a voice assistant, Wi-Fi photo transfer, and IP65 resistance. No subscription needed. Ever. Available now.",
      brand: { "@type": "Brand", name: "Joova" },
      image: `${SITE_URL}/glasses/joova-glasses-front-angle-white-1600.png`,
      url: `${SITE_URL}/glasses`,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: GLASSES_PRICE,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/glasses`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: glassesFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function GlassesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <div className="stage rounded-[24px] p-4 sm:p-6">
          <Image
            src="/glasses/joova-glasses-front-angle-white-1600.png"
            alt="Joova Glasses in matte black, front three-quarter view on a white background"
            width={glassesImageSize.width}
            height={glassesImageSize.height}
            priority
            className="h-auto w-full"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            AI camera glasses
          </p>
          <h1
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Joova Glasses
          </h1>
          <p className="mt-3 font-display text-3xl font-semibold">See it. Snap it. Ask it.</p>
          <p className="mt-3 text-2xl">{glassesPriceLabel}</p>
          <Badge className="mt-4">Available now</Badge>
          <p className="mt-6 text-muted">
            Take hands-free photos and videos, ask questions about what you see,
            and translate conversations in real time, all from glasses that look
            like glasses. {noSubscription}
          </p>
          <p className="mt-3 text-muted">
            Matte black TR90 frame, 38 g. Choose clear blue-light lenses or
            photochromic lenses. A light on the frame turns on while the camera
            is recording.
          </p>
          <AddToCart
            id="glasses"
            name="Joova Glasses"
            price={GLASSES_PRICE}
            colors={["Matte Black, clear lenses", "Matte Black, photochromic"]}
          />
        </div>
      </Container>

      <Section className="bg-stone/40">
        <Container>
          <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
            What they do
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {glassesFeatures.map((feature) => (
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
              {glassesFacts.map((fact) => (
                <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm text-muted">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <Image
              src="/glasses/joova-glasses-features-1600.png"
              alt="Joova Glasses feature card: 8MP camera, AI assistant, live translation, Wi-Fi transfer, IP65, and no subscription"
              width={glassesImageSize.width}
              height={glassesImageSize.height}
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
            {glassesFaqs.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-xl font-semibold">{item.q}</dt>
                <dd className="mt-2 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <Image
            src="/glasses/joova-glasses-hero-banner-1920x900.png"
            alt="Joova Glasses banner. See it. Snap it. Ask it. AI camera glasses with live translation and hands-free photos."
            width={glassesBannerSize.width}
            height={glassesBannerSize.height}
            className="mt-12 h-auto w-full rounded-3xl"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </Container>
      </Section>
    </>
  );
}
